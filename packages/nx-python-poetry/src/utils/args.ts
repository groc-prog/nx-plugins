import chalk from 'chalk';
import yargs from 'yargs';

/**
 * Parses additional arguments passed to a Poetry executor.
 *
 * @param {string} args - The additional arguments as a single string
 * @returns {string[]} A array of parsed strings which can be passed directly to poetry commands
 */
export function parseAdditionalPoetryArgs(args: string): string[] {
  const additionalArgs: string[] = [];

  console.log(chalk.dim('Preparing arguments for install command'));
  const parsedArgs = yargs(args).argv;
  delete parsedArgs['_'];
  delete parsedArgs['$0'];

  console.log(chalk.dim(`Adding ${Object.keys(parsedArgs).length} additional arguments to the install command`));
  Object.entries(parsedArgs).forEach(([key, value]) => {
    if (value === true) {
      additionalArgs.push(`--${key}`);
    } else {
      additionalArgs.push(`--${key}=${value}`);
    }
  });

  return additionalArgs;
}
