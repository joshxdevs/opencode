import chalk from "chalk"


export const ui = {
    success: (msg: string) => console.log(chalk.green("✓ ") + msg),
    error: (msg: string) => console.error(chalk.red("✗ ") + msg),
    info: (msg: string) => console.log(chalk.cyan("ℹ ") + msg),
    warn: (msg: string) => console.log(chalk.yellow("⚠ ") + msg),
    header: (msg: string) => console.log(chalk.bold.underline(msg)),
    dim: (msg: string) => console.log(chalk.dim(msg)),
};