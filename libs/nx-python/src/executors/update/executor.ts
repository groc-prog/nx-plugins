import type { SpawnSyncOptions } from 'child_process';
import type { ExecutorContext } from '@nx/devkit';
import type { UpdateExecutorSchema } from './schema';

import { checkPoetryExecutable, runPoetry, updateSharedEnvironment } from '../../utils/poetry';
import { omit } from 'lodash';
import chalk from 'chalk';

export default async function executor(options: UpdateExecutorSchema, context: ExecutorContext) {
  process.chdir(context.root);

  try {
    await checkPoetryExecutable();
    const projectContext = context.projectsConfigurations.projects[context.projectName];
    console.log(chalk.blue.bold(`\n🚀 Updating dependencies for ${context.projectName}\n`));

    const updateArgs = ['update'];
    const additionalArgs = omit(options, ['dependencies']);

    // Build provided arguments and add any additional arguments to the command
    updateArgs.push(
      ...options.dependencies,
      ...Object.entries(additionalArgs).map(([key, value]) => `--${key}=${value}`)
    );

    const execOpts: SpawnSyncOptions = {
      cwd: projectContext.root,
      env: process.env,
    };

    console.log(chalk.bold(`Updating dependencies ${options.dependencies.join(', ')}...`));
    runPoetry(updateArgs, execOpts);

    updateSharedEnvironment(context);

    console.log(chalk.green(`\n🎉 Successfully updated dependencies in ${context.projectName}`));
    return { success: true };
  } catch (error) {
    console.error(chalk.red(`\n❌ Failed to update dependencies in ${context.projectName}`));
    console.error(`\n${chalk.bgRed('ERROR')} ${error.message}`);
    return { success: false };
  }
}
