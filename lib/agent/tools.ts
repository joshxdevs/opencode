import { execSync } from "child_process";
import { existsSync, readdirSync, readFileSync } from "fs";
import { resolve } from "path";

export interface Tool {
    name: string;
    description: string;
    parameters: Record<string, { type: string; description: string }>
}

export const tools: Tool[] = [
    {
        name: "read_file",
        description: "Read the full contents of a file",
        parameters: {
            path: { type: "string", description: "File path relative to the working directory" }
        }
    },
    {
        name: "list_files",
        description: "List files and folders in a directory",
        parameters: {
            path: { type: "string", description: "Directory path relative to the working directory" }
        }
    },
    {
        name: "run_command",
        description: "Run a shell command and return stdout",
        parameters: {
            command: { type: "string", description: "The shell command to run" }
        }
    }
]

export async function runTool(
    name: string,
    args: Record<string, unknown>,
    cwd: string
): Promise<string> {
    switch (name) {
        case "read_file": {
            const fp = resolve(cwd, args.path as string)
            if (!existsSync(fp)) return `Error: file not found - ${fp}`
            return readFileSync(fp, "utf-8")
        }
        case "list_files": {
            const dp = resolve(cwd, (args.path as string) ?? ".")
            if (!existsSync(dp)) return `Error: directory not found - ${dp}`
            return readdirSync(dp, { withFileTypes: true })
                .map((e) => `${e.isDirectory() ? "Folder " : "File "}${e.name}`)
                .join("\n")
        }
        case "run_command": {
            try {
                return execSync(args.command as string, {
                    cwd,
                    encoding: "utf-8",
                    timeout: 30_000
                })
            } catch (err) {
                return `Error: ${(err as Error).message}`
            }
        }
        default:
            return `Error: Unknown tool "${name}"`
    }
}