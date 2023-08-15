import { runPoetry, type PyProjectToml } from '../../utils/poetry';
import type { Tree } from '@nx/devkit';

import { formatFiles, generateFiles, installPackagesTask } from '@nx/devkit';
import { existsSync } from 'fs-extra';
import { parse, stringify } from '@iarna/toml';
import path from 'path';
import chalk from 'chalk';
import { get, isObject, set } from 'lodash';

export default async function (tree: Tree) {
  process.chdir(tree.root);
  console.log(chalk.blue.bold(`\n🚀 Migrating to a shared virtual environment\n`));
  const config = JSON.parse(tree.read('package.json').toString());

  generateFiles(tree, path.join(__dirname, 'files'), '.', {
    projectName: config.name,
  });

  // Update dependencies in root pyproject.toml
  const rootTomlConfig = parse(tree.read('pyproject.toml').toString()) as PyProjectToml;

  console.log(chalk.bold('Adding dependencies from libs...'));
  tree.children('libs').forEach((lib) => {
    const projectTomlPath = path.join('libs', lib, 'pyproject.toml');

    if (existsSync(projectTomlPath)) {
      console.log(chalk.bold(`Resolving dependencies for lib ${lib}...`));
      const projectTomlConfig = parse(tree.read(projectTomlPath).toString()) as PyProjectToml;
      addSharedDependencies(rootTomlConfig, projectTomlConfig);

      if (rootTomlConfig.tool.poetry.dependencies[projectTomlConfig.tool.poetry.name] === undefined) {
        rootTomlConfig.tool.poetry.dependencies[projectTomlConfig.tool.poetry.name] = {
          path: path.join('libs', lib),
          develop: true,
        };
      }
    }
  });

  console.log(chalk.bold('Adding dependencies from services...'));
  tree.children('services').forEach((service) => {
    const projectTomlPath = path.join('services', service, 'pyproject.toml');

    if (existsSync(projectTomlPath)) {
      console.log(chalk.bold(`Resolving dependencies for service ${service}...`));
      const projectTomlConfig = parse(tree.read(projectTomlPath).toString()) as PyProjectToml;
      addSharedDependencies(rootTomlConfig, projectTomlConfig);
    }
  });

  tree.write('pyproject.toml', stringify(rootTomlConfig));

  await formatFiles(tree);
  return () => {
    installPackagesTask(tree);
    runPoetry(['install']);
  };
}

function addSharedDependencies(rootTomlConfig: PyProjectToml, projectTomlConfig: PyProjectToml): void {
  // Add shared dependencies
  Object.keys(projectTomlConfig.tool.poetry.dependencies).forEach((dependencyName) => {
    const rootDependency = rootTomlConfig.tool.poetry.dependencies[dependencyName];
    const projectDependency = projectTomlConfig.tool.poetry.dependencies[dependencyName];

    // Skip local dependencies, added later on
    if (isObject(projectDependency) || isObject(rootDependency)) return;

    if (rootDependency && projectDependency && rootDependency !== projectDependency)
      throw new Error(
        `Dependency version mismatch for ${dependencyName}. Got version ${projectDependency} in ${projectTomlConfig.tool.poetry.name}
        and ${rootDependency} in shared virtual environment. Resolve the dependency conflict before proceeding.`
      );

    if (rootDependency === undefined) rootTomlConfig.tool.poetry.dependencies[dependencyName] = projectDependency;
  });

  if (get(projectTomlConfig, 'tool.poetry.group.dev.dependencies', null) !== null) {
    if (get(rootTomlConfig, 'tool.poetry.group.dev.dependencies', null) === null)
      set(rootTomlConfig, 'tool.poetry.group.dev.dependencies', {});

    // Add shared dev dependencies
    Object.keys(projectTomlConfig.tool.poetry.group.dev.dependencies).forEach((dependencyName) => {
      const rootDependency = rootTomlConfig.tool.poetry.group.dev.dependencies[dependencyName];
      const projectDependency = projectTomlConfig.tool.poetry.group.dev.dependencies[dependencyName];

      // Skip local dependencies, added later on
      if (isObject(projectDependency) || isObject(rootDependency)) return;

      if (rootDependency && projectDependency && rootDependency !== projectDependency)
        throw new Error(
          `Dependency version mismatch for ${dependencyName}. Got version ${projectDependency} in ${projectTomlConfig.tool.poetry.name}
          and ${rootDependency} in shared virtual environment. Resolve the dependency conflict before proceeding.`
        );

      if (rootDependency === undefined)
        rootTomlConfig.tool.poetry.group.dev.dependencies[dependencyName] = projectDependency;
    });
  }
}
