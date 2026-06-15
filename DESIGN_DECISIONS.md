# The Thinking Behind opencode

> A decision log for **opencode** — an agentic AI coding CLI I built in TypeScript on Bun.
>
> This isn't a feature list. It's a record of *how* I made decisions: the problems I framed,
> the options I weighed, the conclusions I reached, and the tradeoffs I accepted on purpose.
> If you're reading this to understand how I think and solve problems — that's exactly what it's for.

---

## TL;DR — how I approached this project

- I started from a **problem and a bet**, not from a tech stack.
- I optimized for the **smallest thing that proves the idea**, then iterated.
- Every decision below has a cost. I tried to make those costs *chosen*, not accidental.
- Where I took on debt (no tests, no streaming, single provider), I did it knowingly and wrote it down — which is what this document is.

My core belief: **good engineering isn't avoiding tradeoffs, it's choosing them deliberately and being honest about them.**

---

## The problem I set out to solve

Most AI coding tools ask you to leave your workflow: open another app, log into a web UI, copy code out, paste answers back in. Every one of those steps is a context switch, and context switches are where focus goes to die.

I had a simple hypothesis: **developers already live in the terminal, so the agent should too.** No new window, no new tab, no new place to log into. You're working, you ask, it acts — right there.

That hypothesis shaped everything that follows.

---

## Principles I held myself to

1. **Prove the idea before polishing it.** Ship the minimum that demonstrates value.
2. **Make tradeoffs explicit.** A known limitation beats an unknown one.
3. **Keep state portable.** Don't let a vendor's SDK become my architecture.
4. **Security and trust are features, not afterthoughts.**
5. **Boring tech where it doesn't matter, so I can spend novelty where it does.**

---

## The decisions

Each decision is framed the same way: **Context → Options → What I chose → Why → Tradeoff I accepted → What I'd revisit.** That structure *is* the point — it's how I actually reason.

---

### Decision 1 — Terminal-native, not "yet another app"

**Context.** I had to pick the surface the tool lives on: a web app, an editor extension, or a CLI.

**Options I weighed.**
- *Web app* — widest reach, but it's the exact context switch I was trying to kill.
- *Editor extension* — closer to the work, but ties me to one editor's API and release cadence.
- *CLI* — meets developers where their hands already are, scriptable, composable with everything else in their shell.

**What I chose.** A CLI.

**Why.** The whole bet was "remove the context switch." A web app contradicts the thesis. An extension is editor-specific. The terminal is universal, scriptable, and already open. The decision practically made itself once I was honest about the goal.

**Tradeoff accepted.** Smaller addressable audience than a web app, and no rich GUI affordances (no clickable diffs, no panels).

**What I'd revisit.** If adoption justified it, an editor extension that *reuses the same core* — not a rewrite — would be the natural second surface.

---

### Decision 2 — The minimum viable agent: a loop + 3 tools

**Context.** "Agent" can mean anything from a chatbot to a fully autonomous system. I needed to define the smallest version that's genuinely useful.

**The question I kept asking myself.** *"What's the minimum set of capabilities that lets a model do real work on a codebase?"*

**What I chose.** A single reasoning loop and exactly three tools:
- `read_file` — read a file
- `list_files` — see a directory
- `run_command` — execute a shell command

**Why.** I worked backwards from real tasks ("explore this repo," "find why this fails," "run the tests"). Almost all of them decompose into *look around → read something → run something → look at the result.* Three primitives cover that. Adding a fourth before I'd validated the first three would have been speculative.

**The conclusion that surprised me.** With just those three, the agent could explore an unfamiliar repo, locate a problem, and propose a fix — **behavior I never explicitly programmed.** That confirmed the bet: capability is emergent from good primitives plus a loop, not from a long feature list.

**Tradeoff accepted.** `run_command` is doing a lot of heavy lifting — it's both the most powerful tool and the biggest risk surface (more on that in Decision 6 and the roadmap). No first-class git/npm/docker tools yet.

**What I'd revisit.** Promote the most common `run_command` uses into dedicated, safer tools with structured output.

---

### Decision 3 — Keep state provider-agnostic; treat the SDK as disposable

**Context.** The model SDK doesn't persist conversation state between calls. I had to decide what my *source of truth* for the conversation would be.

**Options I weighed.**
- *Let the SDK's chat object be my state.* Less code today.
- *Keep my own neutral message array and rebuild the SDK's object every turn.* More work per turn, but I own the data model.

**What I chose.** A plain `messages[]` array (role + content) as the canonical history. Every turn, I rebuild the provider's chat object from it and translate roles on the way in (e.g. `assistant` → `model`).

**Why.** I asked: *"If I want to support a second model provider later, what will I regret?"* The answer was obvious — coupling my architecture to one vendor's chat object. By keeping a neutral representation, swapping providers becomes a **translation layer, not a rewrite.** The message array is the real product; the SDK object is a detail I can throw away each turn.

**Tradeoff accepted.** Rebuilding the chat object every iteration is less efficient than mutating a persistent one. At this scale that cost is invisible, and I'd rather pay it for portability.

**What I'd revisit.** If conversations get very long, I'll add context windowing/summarization *on top of* the same neutral array — the abstraction is already in the right place to make that easy.

---

### Decision 4 — Gemini first, with the abstraction underneath

**Context.** I built a provider/credential abstraction, but the agent loop currently talks to exactly one model provider (Google Gemini).

**The honest tension.** "Multi-provider" is the goal; today it's Gemini-only. I could have built two integrations from the start.

**What I chose.** Go deep on one provider first, while keeping the credential/config layer provider-shaped.

**Why.** Supporting M providers across N features is an N×M cost, and most of that cost is wasted if the core loop turns out to be wrong. I'd rather make *one* integration genuinely solid — tool-calling, schema serialization, history handling — and prove the loop, than have two shallow, half-working integrations. Depth before breadth.

**Tradeoff accepted.** I have to be careful not to *over-claim* multi-provider support. It's an architecture that's ready for it, not a shipped feature — and I say so plainly rather than letting the README imply more than is true.

**What I'd revisit.** Adding a second provider (OpenAI/Anthropic) is the clearest validation that Decision 3's abstraction actually holds. That's the next big test.

---

### Decision 5 — Safety rails: a 20-iteration cap and a 30-second command timeout

**Context.** An autonomous loop calling a paid API and executing shell commands has two obvious failure modes: it never stops, or a command hangs forever.

**What I chose.**
- Hard cap of **20 iterations** per task.
- **30-second timeout** on every command execution.

**Why.** Autonomy without bounds is a liability. The iteration cap guarantees termination and protects against runaway API bills. The command timeout stops a hung process from freezing the whole agent. These are cheap insurance against expensive, hard-to-debug failures.

**Tradeoff accepted.** A genuinely long task (a big test suite, a slow build) can get cut off, and the limits aren't yet user-configurable. I chose a safe default over flexibility for v1.

**What I'd revisit.** Make both limits configurable (`--max-iterations`, a timeout flag) and stream partial output so a long command isn't all-or-nothing.

---

### Decision 6 — Treat credentials and trust as first-class

**Context.** The tool stores API keys and runs on developers' machines. Mishandling either erodes trust instantly.

**What I chose.**
- API keys written with **owner-only file permissions (`0600`)**.
- Keys **masked** in CLI output (first/last few chars only).
- **Separation of files** in `~/.opencode`: config, credentials, and cache are distinct, so they can have different permissions and lifecycles.

**Why.** I asked, *"What's the embarrassing failure here?"* — leaking a key in a screen-share or a world-readable file. Masking output and locking file permissions are tiny amounts of code that remove a whole class of trust failures. Separating the files follows least-privilege: only the secrets get the strict treatment.

**Tradeoff accepted.** Keys are protected by filesystem permissions, not encrypted at rest. For a local dev tool that's a reasonable line; for a hardened environment it isn't enough.

**What I'd revisit — and I'll name it honestly.** Right now `run_command` can execute *any* shell command the model proposes, and `read_file` doesn't yet enforce a working-directory boundary. That's the most important hardening work: sandboxing, an allow/deny policy, path-traversal guards, and a confirmation step for destructive actions. I'd rather state this plainly than pretend it's solved — knowing where your sharp edges are is part of the job.

---

### Decision 7 — Offline-first model discovery

**Context.** Model metadata (context limits, pricing, tool-call support) changes over time. I didn't want to hardcode it and ship stale data in every release.

**What I chose.** Fetch model data from an external registry (models.dev), cache it locally with a **24-hour TTL**, and **fall back to the cache when the network fails.**

**Why.** Three priorities, in order: be fast (don't hit the network if fresh data is cached), be current (refresh daily, with a manual `--refresh` escape hatch), and be resilient (a developer offline on a plane should still get a working CLI). Data-driven beats hardcoded because the tool stays accurate without a release.

**Tradeoff accepted.** A brand-new model can be up to 24 hours late to appear, and there's an external dependency in the path. The manual refresh flag covers the impatient case.

**What I'd revisit.** A smarter refresh policy (background revalidation) and graceful degradation if the registry's schema ever shifts.

---

### Decision 8 — Boring tech where it doesn't matter

**Context.** I had to pick build tooling and a stack for both the CLI and its landing page.

**What I chose.**
- CLI: **TypeScript + Bun** (build and run, no separate bundler/transpiler config), with `commander` for arg parsing and `chalk` for output.
- Landing page: **vanilla HTML/CSS/JS, zero dependencies.**

**Why.** I want my novelty budget spent on the hard, interesting part — the agent loop — not on fighting a build pipeline or a frontend framework. Bun collapses build/run into one tool. The site is content and a demo; a framework would add weight and maintenance for no user benefit. Fewer moving parts means faster shipping and fewer 2am bugs.

**Tradeoff accepted.** Bun is younger than the Node toolchain, and a no-framework site gets harder to maintain if it ever grows complex. Both are fine bets at this scale.

**What I'd revisit.** Only if the site grew into an app would a framework earn its keep.

---

### Decision 9 — Shipping with deliberate debt: no streaming, no tests (yet)

**Context.** Two things a "finished" version would have that this one doesn't: streaming output, and an automated test suite.

**What I chose.** Ship without them — on purpose — to validate the core idea first.

**Why.** The goal of v1 was to answer *"does a terminal-native agent loop actually feel good to use?"* Neither streaming nor tests change that answer. Streaming is UX polish; tests protect a design I might still throw away. Building either before validating the concept risks polishing the wrong thing.

**Tradeoff accepted — stated plainly.**
- *No streaming:* a long model response feels frozen while you wait.
- *No tests:* the loop has real complexity (history management, role translation, feeding tool results back), and right now nothing guards against regressions when I refactor.

**What I'd revisit — and this is the top of the list.** Now that the loop is validated, tests come first (the role translation and tool-feedback logic especially), then streaming for the UX win. Validated debt is fine; *permanent* debt is not.

---

## Mistakes and things I'd do differently

I'd rather show judgment about my own work than pretend it's flawless.

- **Lockfile drift.** The npm lockfile and the Bun lockfile aren't perfectly in sync. Using two package managers created an inconsistency I should have caught — pick one source of truth.
- **The README over-implies multi-provider.** The architecture is ready; the feature isn't shipped. I've corrected how I talk about it, because credibility matters more than a bigger-sounding feature list.
- **Tests should have come the moment the loop stabilized,** not "later." The longer untested complex code lives, the scarier it is to change.

---

## How I think (the meta-summary)

If you've read this far, here's the pattern underneath all of it:

1. **Start from the problem and a falsifiable bet,** not from the tech.
2. **Find the smallest thing that proves the bet,** and build exactly that.
3. **For every decision, ask "what will I regret?"** and let that pick the tradeoff.
4. **Make limitations explicit** — to myself, in docs, and to users.
5. **Spend complexity where it differentiates** (the agent loop) and buy simplicity everywhere else.
6. **Treat debt as a loan, not a gift** — take it consciously, write it down, pay it back once the risk it covered is gone.

I don't think the goal is code with no tradeoffs. I think the goal is tradeoffs you can defend.

---

## Roadmap (where this thinking points next)

- Sandboxing + guardrails around command execution (highest priority for trust)
- A test suite, starting with the agent loop's state handling
- Streaming output
- A real second provider, to prove the abstraction
- Context windowing for large file reads
- User-configurable limits (iterations, timeouts)

---

*opencode is open source and intentionally early (v0.1.4). Building it in the open — including documents like this one — is part of how I work.*

opencode.joshuapaul.site · github.com/joshxdevs/opencode · `npm i -g @joshxdevs/opencode`
