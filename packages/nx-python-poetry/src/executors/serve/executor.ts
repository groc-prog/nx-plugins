import type { ExecutorContext } from '@nx/devkit';
import chalk from 'chalk';
import spawn from 'cross-spawn';
import path from 'path';

import type { ServeExecutorSchema } from './schema';

/**
 * Runs the development server for the current project using nodemon. This is done by activating the
 * virtual environment and then running the main.py file in the project's module.
 */
export default async function executor(
  options: ServeExecutorSchema,
  context: ExecutorContext,
): Promise<{ success: boolean }> {
  process.chdir(context.root);

  const projectContext = context.projectsConfigurations.projects[context.projectName];
  const moduleName = context.projectName.replace('-', '_');

  // Create a new promise here since the executor would stop immediately otherwise since it does not wait
  // for the nodemon process to finish
  return new Promise((resolve, reject) => {
    try {
      console.log(
        chalk.blue(`\n${chalk.bgBlue(' INFO ')} 🚀 Starting development server for ${context.projectName}\n`),
      );

      // Activate the virtual environment and start the development server
      const command = `source ${path.join(
        '.venv',
        'bin',
        'activate',
      )} && pnpx nodemon --watch ${moduleName} ${path.join(moduleName, 'main.py')}`;

      console.log(chalk.dim(`Starting development server with command ${command}\n`));
      const nodemon = spawn(command, {
        cwd: projectContext.root,
        env: process.env,
        shell: true,
        stdio: 'inherit',
      });

      nodemon.on('error', (error) => {
        throw error;
      });

      nodemon.on('close', (code) => {
        resolve({ success: code === 0 });
      });
    } catch (error) {
      console.error(chalk.red(`\n${chalk.bgRed(' ERROR ')} ❌ Development server unexpectedly crashed`));
      console.error(chalk.red(`\n${error.message}`));
      reject({ success: false });
    }
  });
}
