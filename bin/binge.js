#!/usr/bin/env node
/*
 * The "shebang" above is required for npm to correctly and install package the
 * package bin shortcut on windows
 * see: https://github.com/ForbesLindesay/cmd-shim/blob/f59af911f1373239a7537072641d55ff882c3701/index.js#L22
 */

var binge = require("../lib/index").default
var chalk = require("chalk")
var meow = require("meow")

var cli = meow([
  "Usage",
  "  $ binge [command]",
  "",
  "Commands:",
  "  bootstrap  Prune, Install, and Build local packages (each step with optimistic skips)",
  "  watch      Watches file dependencies, and copies them to the current package",
  "  clean      Remove the node_modules directory from all local packages",
  "  run        TODO - Run npm script in each package",
  "  exec       TODO - Run a command in each package",
  "  harmony    TODO - Print a tree with all non harmonized dependencies",
  "  ls         Output the local package dependency tree",
  "",
  "Options:",
  //"  --skip-install     TODO Skip the install step ('build' and 'watch' commands only)",
  //"  --skip-prepublish  TODO Skip the prepublish step ('build' and 'watch' commands only)",
  //"  --skip-connect     TODO Skip the connect step ('build' and 'watch' commands only)",
  //"  --ignore [glob]    Ignores packages with names matching the given glob (Works only in combination with the 'bootstrap' command).",
  "  --cwd                Set the current working directory",
  "  --dry-run            Only works with the bootstrap command",
  "  --concurrency        TODO Limit the parallel factor that binge uses on async (defaults to 8)",
  "  --loud               TODO Output all available inforomation",
  //"  --social (default)   TODO Output information about the current task and current step",
  "  --quiet              TODO Output only the final timing-success-failure statement",
  "  --silent             TODO No outputs"
], {
  alias: {

  }
})

require("signal-exit").unload()

var commandName = cli.input[0]
var command = binge[commandName]

if (!command) {
    if (commandName) {
        console.log(chalk.red("Invalid binge command: " + commandName))
    }

    cli.showHelp()
} else {
    console.time("execution")
    process.on("exit", () => console.timeEnd("execution"))
    if(cli.flags.cwd) {
        process.chdir(cli.flags.cwd)
        console.log("[Binge] Executing in " + chalk.magenta(process.cwd()))
    }

    command(cli.flags)
}
