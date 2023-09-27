import type { ExecutorContext } from '@nx/devkit';
import type { BuildExecutorSchema } from './schema';
import type { PyProjectToml } from '../../utils/poetry';

import { copySync, readFileSync, mkdirSync, ensureDirSync, writeFileSync, removeSync } from 'fs-extra';
import { parse, stringify } from '@iarna/toml';
import { checkPoetryExecutable, runPoetry } from '../../utils/poetry';
import { tmpdir } from 'os';
import { v4 as uuidv4 } from 'uuid';
import { isObject } from 'lodash';
import chalk from 'chalk';
import path from 'path';

const IGNORED_PATHS = ['.venv', 'build', 'tests', 'project.json'];

export default async function executor(options: BuildExecutorSchema, context: ExecutorContext) {
  try {
    await checkPoetryExecutable();

    console.log(chalk.blue(`\n${chalk.bgBlue(' INFO ')} 🛠️ Building ${context.projectName}\n`));
    const { root } = context.workspace.projects[context.projectName];
    const tmpBuildFolderPath = path.join(tmpdir(), 'nx-python', 'build', uuidv4());
    const buildFolderPath = path.join(root, options.outputPath);
    const rootPath = path.resolve(root);

    // Map ignore paths to absolute paths
    options.ignorePaths = [...IGNORED_PATHS, ...options.ignorePaths];
    options.ignorePaths = options.ignorePaths.map((ignorePath) => path.join(root, ignorePath));

    console.log(chalk.dim(`Creating temporary directory ${tmpBuildFolderPath}\n`));
    mkdirSync(tmpBuildFolderPath, { recursive: true });
    copySync(rootPath, tmpBuildFolderPath, { filter: (file) => !options.ignorePaths.includes(file) });

    const buildPyProjectToml = path.join(tmpBuildFolderPath, 'pyproject.toml');
    const buildTomlData = parse(readFileSync(buildPyProjectToml).toString('utf-8')) as PyProjectToml;

    resolveDependencies(buildTomlData, rootPath, tmpBuildFolderPath, rootPath);
    writeFileSync(buildPyProjectToml, stringify(buildTomlData));

    console.log(chalk.dim('\nBuilding artifacts...'));
    runPoetry(['build'], { cwd: tmpBuildFolderPath, env: process.env });

    ensureDirSync(buildFolderPath);
    copySync(path.join(tmpBuildFolderPath, 'dist'), buildFolderPath, { overwrite: true });
    removeSync(tmpBuildFolderPath);

    console.log(chalk.green(`\n${chalk.bgGreen(' SUCCESS ')} 🎉 Successfully built ${context.projectName}!`));
    return { success: true };
  } catch (error) {
    console.error(chalk.red(`\n${chalk.bgRed(' ERROR ')} ❌ Failed to build ${context.projectName}!`));
    console.error(chalk.red(`\n${error.message}`));
    return { success: false };
  }
}

/**
 * Resolves dependencies for the project to be built and copies them to the build folder.
 *
 * @param {PyProjectToml} pyProjectTomlData - pyproject.toml data of the project to be built
 * @param {string} dependencyProjectPath - Path from the workspace root to the project for which dependencies are being resolved
 * @param {string} buildFolderPath - Path to the build folder
 * @param {string} projectPath - Path to the root of the project being built
 * @throws {Error} - If dependency versions mismatch
 */
function resolveDependencies(
  pyProjectTomlData: PyProjectToml,
  dependencyProjectPath: string,
  buildFolderPath: string,
  projectPath: string
): void {
  console.log(chalk.dim(`Resolving dependencies for ${dependencyProjectPath}`));
  const dependencyPyProjectToml = path.join(dependencyProjectPath, 'pyproject.toml');
  const dependencyTomlData = parse(readFileSync(dependencyPyProjectToml).toString('utf-8')) as PyProjectToml;

  Object.keys(dependencyTomlData.tool.poetry.dependencies).forEach((dependencyName) => {
    const projectDependency = dependencyTomlData.tool.poetry.dependencies[dependencyName];
    const buildDependency = pyProjectTomlData.tool.poetry.dependencies[dependencyName];

    if (isObject(projectDependency) && projectDependency.path) {
      const newProjectPath = path.join(dependencyProjectPath, projectDependency.path);

      resolveDependencies(pyProjectTomlData, newProjectPath, buildFolderPath, projectPath);
      copyDependencyProject(pyProjectTomlData, dependencyName, newProjectPath, buildFolderPath);

      pyProjectTomlData.tool.poetry.dependencies[dependencyName] = undefined;
    } else {
      if (buildDependency && buildDependency !== projectDependency)
        throw new Error(
          `Dependency version mismatch for ${dependencyName}. Found versions ${projectDependency} and ${buildDependency}. Resolve the dependency conflict before proceeding.`
        );

      pyProjectTomlData.tool.poetry.dependencies[dependencyName] = projectDependency;
    }
  });
}

/**
 * Copies the dependency project to the build folder and adds it to the `pyproject.toml` of the
 * project to be built.
 *
 * @param {PyProjectToml} pyProjectTomlData - pyproject.toml data of the project to be built
 * @param {string} dependencyName - Name of the dependency
 * @param {string} dependencyProjectPath - Path to the dependency project from the workspace root
 * @param {string} buildFolderPath - Path to the build folder
 */
function copyDependencyProject(
  pyProjectTomlData: PyProjectToml,
  dependencyName: string,
  dependencyProjectPath: string,
  buildFolderPath: string
): void {
  const ignorePaths = IGNORED_PATHS.map((ignorePath) => path.join(dependencyProjectPath, ignorePath));

  console.log(chalk.dim(`Copying dependency ${dependencyName} to ${buildFolderPath}`));
  copySync(dependencyProjectPath, buildFolderPath, { filter: (file) => !ignorePaths.includes(file) });
  pyProjectTomlData.tool.poetry.packages.push({ include: dependencyName.replace('-', '_') });
}
