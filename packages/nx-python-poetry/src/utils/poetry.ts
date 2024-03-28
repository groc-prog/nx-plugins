import toml from '@iarna/toml';
import type { ExecutorContext } from '@nx/devkit';
import chalk from 'chalk';
import type { SpawnSyncOptions } from 'child_process';
import commandExists from 'command-exists';
import spawn from 'cross-spawn';
import { readFileSync, writeFileSync, existsSync } from 'fs-extra';
import { get, isObject, set } from 'lodash';
import path from 'path';
import semver from 'semver';

export type PyProjectTomlDependency = string | { path?: string; develop?: boolean; version?: string };
export type PyProjectTomlDependencies = {
  [key: string]: PyProjectTomlDependency;
};
export type PyProjectToml = {
  tool?: {
    poetry?: {
      name: string;
      version: string;
      source?: {
        name: string;
        url: string;
      }[];
      packages?: Array<{
        include: string;
      }>;
      dependencies?: PyProjectTomlDependencies;
      group?: {
        [key: string]: {
          dependencies: PyProjectTomlDependencies;
        };
      };
    };
  };
};

export const POETRY_EXECUTABLE = 'poetry' as const;

/**
 * Checks if Poetry is installed.
 *
 * @throws {Error} - If Poetry is not installed
 * @returns {Promise<void>}
 */
export async function checkPoetryExecutable(): Promise<void> {
  try {
    await commandExists(POETRY_EXECUTABLE);
  } catch (e) {
    throw new Error('Poetry is not installed. Please install Poetry before running this command.');
  }
}

/**
 * Run the Poetry command with given arguments.
 *
 * @param {string[]} args - Arguments to pass to poetry
 * @param {SpawnSyncOptions} options - Options to pass to spawn
 * @throws {Error}
 * @returns {void}
 */
export function runPoetry(args: string[], options: SpawnSyncOptions = {}): void {
  const commandStr = `${POETRY_EXECUTABLE} ${args.join(' ')}`;
  console.log(chalk.dim(`\n${chalk.bgGray(' POETRY ')} Running ${commandStr}\n`));

  const result = spawn.sync(POETRY_EXECUTABLE, args, {
    ...options,
    shell: false,
    stdio: 'inherit',
  });

  if (result.status !== 0) throw new Error(`${commandStr} command failed with exit code ${result.status}`);
}

/**
 * Updates the shared virtual environment with the latest dependencies.
 *
 * @param {ExecutorContext} context - Executor context.
 * @returns {void}
 */
export function updateSharedEnvironment(context: ExecutorContext): void {
  const rootTomlPath = path.join(context.root, 'pyproject.toml');

  // If we find no virtual environment, we skip the update
  if (!existsSync(rootTomlPath)) {
    chalk.dim(`No virtual environment found in ${context.root}, skipping...`);
    return;
  }

  console.log(chalk.blue(`\n${chalk.bgBlue(' INFO ')} Updating shared virtual environment\n`));
  const rootTomlConfig = toml.parse(readFileSync(rootTomlPath, 'utf-8')) as PyProjectToml;

  // Clear dependencies and dev dependencies
  rootTomlConfig.tool.poetry.dependencies = {};
  if (get(rootTomlConfig, 'tool.poetry.group.dev.dependencies', null) !== null)
    set(rootTomlConfig, 'tool.poetry.group.dev.dependencies', {});

  // Check all projects for changes
  Object.keys(context.projectsConfigurations.projects).forEach((project) => {
    const projectTomlPath = path.join(context.projectsConfigurations.projects[project].root, 'pyproject.toml');

    // If we find no pyproject.toml file, we skip the project
    if (!existsSync(projectTomlPath)) return;

    // Parse the TOML file and add all dependencies to the root TOML file
    // This way we can also detect dependency version mismatches
    console.log(chalk.dim(`Checking project ${project} for changes`));
    const projectTomlConfig = toml.parse(readFileSync(projectTomlPath, 'utf-8')) as PyProjectToml;
    addSharedDependencies(rootTomlConfig, projectTomlConfig);
  });

  writeFileSync(rootTomlPath, toml.stringify(rootTomlConfig));
  runPoetry(['lock'], {
    cwd: context.root,
    env: process.env,
  });
  runPoetry(['install', '--sync'], {
    cwd: context.root,
    env: process.env,
  });

  console.log(chalk.green(`\n${chalk.bgGreen(' SUCCESS ')} Shared virtual environment updated successfully!`));
}

/**
 * Adds shared dependencies to the root pyproject.toml file.
 *
 * @param {PyProjectToml} rootTomlConfig - Root pyproject.toml file
 * @param {PyProjectToml} projectTomlConfig - Project pyproject.toml file
 * @throws {Error} - If dependency version mismatch is detected
 * @returns {void}
 */
export function addSharedDependencies(rootTomlConfig: PyProjectToml, projectTomlConfig: PyProjectToml): void {
  // Add shared dependencies
  Object.keys(projectTomlConfig.tool.poetry.dependencies).forEach((dependencyName) => {
    const rootDependency = rootTomlConfig.tool.poetry.dependencies[dependencyName];
    const projectDependency = projectTomlConfig.tool.poetry.dependencies[dependencyName];

    // If the dependency is a local path, we know it's a local package
    // We don't need to check for version compatibility in this case
    if (isObject(projectDependency) && projectDependency.path) {
      if (rootDependency === undefined)
        rootTomlConfig.tool.poetry.dependencies[dependencyName] = {
          develop: true,
          path: projectDependency.path.replace(/^(\.\.\/)*/, ''),
        };

      return;
    }

    // Check for version compatibility before adding the dependency
    // If we find a version mismatch, we throw an error
    if (
      rootDependency &&
      projectDependency &&
      !checkVersionCompatible(rootDependency, projectDependency, dependencyName)
    )
      throw new Error(
        `Dependency version mismatch for ${dependencyName}. Got version ${
          isObject(projectDependency) ? projectDependency.version : projectDependency
        } in ${projectTomlConfig.tool.poetry.name} and ${
          isObject(rootDependency) ? rootDependency.version : rootDependency
        } in shared virtual environment. Resolve the dependency conflict before proceeding.`,
      );

    if (rootDependency === undefined) rootTomlConfig.tool.poetry.dependencies[dependencyName] = projectDependency;
  });

  // We do the same for all dev-dependencies, again checking for version compatibility
  // and local packages
  if (get(projectTomlConfig, 'tool.poetry.group.dev.dependencies', null) !== null) {
    if (get(rootTomlConfig, 'tool.poetry.group.dev.dependencies', null) === null)
      set(rootTomlConfig, 'tool.poetry.group.dev.dependencies', {});

    Object.keys(projectTomlConfig.tool.poetry.group.dev.dependencies).forEach((dependencyName) => {
      const rootDependency = rootTomlConfig.tool.poetry.group.dev.dependencies[dependencyName];
      const projectDependency = projectTomlConfig.tool.poetry.group.dev.dependencies[dependencyName];

      if (isObject(projectDependency) && projectDependency.path) {
        if (rootDependency === undefined)
          rootTomlConfig.tool.poetry.dependencies[dependencyName] = {
            develop: true,
            path: projectDependency.path.replace(/^(\.\.\/)*/, ''),
          };

        return;
      }

      if (
        rootDependency &&
        projectDependency &&
        !checkVersionCompatible(rootDependency, projectDependency, dependencyName)
      )
        throw new Error(
          `Dependency version mismatch for ${dependencyName}. Got version ${
            isObject(projectDependency) ? projectDependency.version : projectDependency
          } in ${projectTomlConfig.tool.poetry.name} and ${
            isObject(rootDependency) ? rootDependency.version : rootDependency
          } in shared virtual environment. Resolve the dependency conflict before proceeding.`,
        );

      if (rootDependency === undefined) rootTomlConfig.tool.poetry.dependencies[dependencyName] = projectDependency;
    });
  }

  // If any sources, we add them to the root TOML file as well to ensure they are available
  // when running the shared virtual environment
  if (get(projectTomlConfig, 'tool.poetry.source', null) !== null) {
    if (get(rootTomlConfig, 'tool.poetry.source', null) === null) set(rootTomlConfig, 'tool.poetry.source', []);

    const rootTomlSources: string[] = get(rootTomlConfig, 'tool.poetry.source', []).map((source) => source.name);
    projectTomlConfig.tool.poetry.source.forEach((source) => {
      if (!rootTomlSources.includes(source.name)) rootTomlConfig.tool.poetry.source.push(source);
    });
  }
}

/**
 * Checks if two given versions are compatible. Since Poetry uses semantic versioning, we can use
 * the semver ({@link https://www.npmjs.com/package/semver}) package to determine compatibility.
 * In the case that the version is not a valid semver range, we skip the check and assume compatibility.
 *
 * @param {PyProjectTomlDependency} rootDependency - Root dependency version in the format <MAJOR>.<MINOR>.<PATCH>
 * @param {PyProjectTomlDependency} projectDependency - Project dependency version in the format <MAJOR>.<MINOR>.<PATCH>
 * @param {string} dependencyName - The name of the dependency
 * @returns {boolean} True if versions are compatible, false otherwise
 */
export function checkVersionCompatible(
  rootDependency: PyProjectTomlDependency,
  projectDependency: PyProjectTomlDependency,
  dependencyName: string,
): boolean {
  // Check whether the dependency defines the version directly using a string or an object
  let rootDependencyVersion = typeof rootDependency === 'string' ? rootDependency : rootDependency.version;
  let projectDependencyVersion = typeof projectDependency === 'string' ? projectDependency : projectDependency.version;

  console.log(
    chalk.dim(
      `Checking compatibility between ${dependencyName} versions ${rootDependencyVersion} and ${projectDependencyVersion}`,
    ),
  );
  if (rootDependencyVersion === undefined || projectDependencyVersion === undefined) return false;
  if (rootDependencyVersion === '*' || projectDependencyVersion === '*') return true;

  rootDependencyVersion = rootDependencyVersion.replace(/,/g, ' ');
  projectDependencyVersion = projectDependencyVersion.replace(/,/g, ' ');

  const rootDependencyRange = semver.validRange(rootDependencyVersion);
  const projectDependencyRange = semver.validRange(projectDependencyVersion);

  // Skip check and assume the versions are compatible if they are not valid
  if (rootDependencyRange === null || projectDependencyRange === null) {
    console.warn(
      chalk.yellow(
        `\n${chalk.bgYellow(
          ' WARN ',
        )} Unprocessable version numbers ${rootDependencyVersion} and ${projectDependencyVersion} encountered for ${dependencyName}, skipping`,
      ),
    );
    return true;
  }

  return (
    semver.intersects(rootDependencyRange, projectDependencyRange) &&
    semver.intersects(projectDependencyRange, rootDependencyRange)
  );
}
