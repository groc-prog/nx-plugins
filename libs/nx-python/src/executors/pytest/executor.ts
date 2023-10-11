import type { SpawnSyncOptions } from 'child_process';
import type { ExecutorContext } from '@nx/devkit';
import chalk from 'chalk';

import type { PytestExecutorSchema } from './schema';
import { checkPoetryExecutable, runPoetry } from '../../utils/poetry';

/**
 * Runs tests for the current project.
 *
 * @param {PytestExecutorSchema} options - Executor options
 * @param {ExecutorContext} context - Executor context
 * @returns {Promise<{ success: boolean }>} - Promise containing success status
 */
export default async function executor(
  options: PytestExecutorSchema,
  context: ExecutorContext,
): Promise<{ success: boolean }> {
  process.chdir(context.root);

  try {
    await checkPoetryExecutable();
    const projectContext = context.projectsConfigurations.projects[context.projectName];
    console.log(chalk.blue(`\n${chalk.bgBlue(' INFO ')}🔍 Running tests in ${context.projectName}\n`));

    const moduleName = context.projectName.replace('-', '_');

    const execOpts: SpawnSyncOptions = {
      cwd: projectContext.root,
      env: process.env,
    };

    if (options.withCoverage) {
      console.log(chalk.dim('Test coverage is enabled'));
      runPoetry(['run', 'pytest', '--cov', moduleName, '--cov-report', 'html:test/coverage', 'tests'], execOpts);
    } else {
      console.log(chalk.dim('Test coverage is disabled'));
      runPoetry(['run', 'pytest', 'tests'], execOpts);
    }

    console.log(chalk.green(`\n${chalk.bgGreen(' SUCCESS ')} 🎉 Successfully ran tests in ${context.projectName}`));
    return { success: true };
  } catch (error) {
    console.error(chalk.red(`\n${chalk.bgRed(' ERROR ')}❌ Failed to finish tests in ${context.projectName}`));
    console.error(chalk.red(`\n${error.message}`));
    return { success: false };
  }
}
