import chalk from 'chalk';

export default function help() {
    console.log(`
  ${chalk.bold('klave')} [options] <command | path>

  ${chalk.dim('Commands:')}
    create          Create a new app
    info            Show CLI information
    version         Show CLI version

  ${chalk.dim('Commands:')}
    --help, -h      Show help
    --version, -v   Show version
    --name          Specify a name for the app
    `);
}
