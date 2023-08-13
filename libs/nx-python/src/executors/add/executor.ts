import type { SpawnSyncOptions } from 'child_process';
import type { ExecutorContext } from '@nx/devkit';
import type { AddExecutorSchema } from './schema';
import type { PyprojectToml } from '../../utils/poetry';

import { checkPoetryExecutable, runPoetry } from '../../utils/poetry';
import { isObject, omit } from 'lodash';
import chalk from 'chalk';
import toml from '@iarna/toml';
import fs from 'fs';
import path from 'path';

export default async function executor(options: AddExecutorSchema, context: ExecutorContext) {
  process.chdir(context.root);

  try {
    await checkPoetryExecutable();
    const projectContext = context.workspace.projects[context.projectName];
    const execOpts: SpawnSyncOptions = {
      cwd: projectContext.root,
      env: process.env,
    };

    if (options.local) {
      // Install dependencies locally
      console.log(chalk`\n  {bold Adding local dependencies: ${options.dependencies.join(', ')}}\n`);
      addLocalProject(context, options.dependencies);

      // Lock dependencies
      runPoetry(['update', '--lock'], execOpts);
    } else {
      const addArgs = ['add'];
      const additionalArgs = omit(options, ['dependencies', 'local']);

      // Build provided arguments and add any additional arguments to the command
      addArgs.push(
        ...options.dependencies,
        ...Object.entries(additionalArgs).map(([key, value]) => `--${key}=${value}`)
      );

      console.log(chalk`\n  {bold Adding dependencies: ${options.dependencies.join(', ')}}\n`);
      runPoetry(addArgs, execOpts);
    }

    console.log(chalk`\n  {green Dependencies have been successfully added to the project}\n`);
    return { success: true };
  } catch (error) {
    console.error(chalk`\n  {bgRed.bold  ERROR } ${error.message}\n`);
    return { success: false };
  }
}

/**
 * Adds dependencies to current projects pyproject.toml
 *
 * @param {ExecutorContext} context - Executor context
 * @param {string[]} dependencies - Dependencies to add
 * @throws {Error} - Throws error if dependency is not found in the Nx workspace
 * @returns {void}
 */
function addLocalProject(context: ExecutorContext, dependencies: string[]): void {
  // Get current pyproject.toml file path
  const projectPath = context.workspace.projects[context.projectName];
  const projectTomlConfig = path.join(projectPath.root, 'pyproject.toml');

  const projectTomlData = toml.parse(fs.readFileSync(projectTomlConfig, 'utf-8')) as PyprojectToml;

  // Add dependencies to pyproject.toml
  dependencies.forEach((dependency) => {
    if (!context.workspace.projects[dependency])
      throw new Error(chalk`Project {bold ${dependency}} not found in the Nx workspace`);

    projectTomlData.tool.poetry.dependencies[dependency] = {
      path: path.relative(projectPath.root, context.workspace.projects[dependency].root),
      develop: true,
    };

    // Add any local dependencies defined in dependency's pyproject.toml
    const dependencyTomlConfig = path.join(context.workspace.projects[dependency].root, 'pyproject.toml');

    if (!fs.existsSync(dependencyTomlConfig))
      throw new Error(chalk`Project {bold ${dependency}} not found in the Nx workspace`);

    const dependencyTomlData = toml.parse(fs.readFileSync(dependencyTomlConfig, 'utf-8')) as PyprojectToml;

    Object.keys(dependencyTomlData.tool.poetry.dependencies).forEach((dependencyName) => {
      if (isObject(dependencyTomlData.tool.poetry.dependencies[dependencyName])) {
        projectTomlData.tool.poetry.dependencies[dependencyName] = {
          path: path.relative(projectPath.root, `libs/${dependencyName}`),
          develop: true,
        };
      }
    });

    // Write pyproject.toml
    fs.writeFileSync(projectTomlConfig, toml.stringify(projectTomlData));
  });
}
