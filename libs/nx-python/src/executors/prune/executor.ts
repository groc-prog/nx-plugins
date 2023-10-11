import type { ExecutorContext, ProjectConfiguration } from '@nx/devkit';
import { copySync, readJSONSync } from 'fs-extra';
import chalk from 'chalk';
import path from 'path';

import type { PruneExecutorSchema } from './schema';
import { checkPoetryExecutable } from '../../utils/poetry';

/**
 * Prunes the files for a docker environment.
 *
 * @param {PruneExecutorSchema} options - Executor options
 * @param {ExecutorContext} context - Executor context
 * @returns {Promise<{ success: boolean }>} - Promise containing success status
 */
export default async function executor(
  options: PruneExecutorSchema,
  context: ExecutorContext,
): Promise<{ success: boolean }> {
  try {
    await checkPoetryExecutable();

    console.log(chalk.blue(`\n${chalk.bgBlue(' INFO ')} 🛠️ Pruning files for ${context.projectName}\n`));
    const projectRootPath = path.resolve(context.workspace.projects[context.projectName].root);

    resolveDependencies(context.root, projectRootPath);

    console.log(
      chalk.green(`\n${chalk.bgGreen(' SUCCESS ')} 🎉 Successfully pruned files for ${context.projectName}!`),
    );
    return { success: true };
  } catch (error) {
    console.error(chalk.red(`\n${chalk.bgRed(' ERROR ')} ❌ Failed to prune ${context.projectName}!`));
    console.error(chalk.red(`\n${error.message}`));
    return { success: false };
  }
}

/**
 * Resolves the dependencies for a given project.
 *
 * @param {string} rootPath - The root path of the project
 * @param {string} projectPath - The path of the project
 * @returns {void}
 */
function resolveDependencies(rootPath: string, projectPath: string): void {
  console.log(chalk.dim(`Resolving dependencies for ${projectPath}`));
  const projectConfiguration: ProjectConfiguration = readJSONSync(path.join(projectPath, 'project.json'));

  copySync(projectPath, path.join(rootPath, 'out'));

  if (projectConfiguration.implicitDependencies === undefined) return;

  projectConfiguration.implicitDependencies.forEach((implicitDependency) => {
    resolveDependencies(rootPath, path.join(rootPath, implicitDependency));
  });
}
