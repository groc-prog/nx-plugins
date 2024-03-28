import { parse, stringify } from '@iarna/toml';
import type { Tree } from '@nx/devkit';
import { formatFiles, generateFiles, installPackagesTask, workspaceLayout } from '@nx/devkit';
import chalk from 'chalk';
import { existsSync } from 'fs-extra';
import path from 'path';

import type { PyProjectToml } from '../../utils/poetry';
import { runPoetry, addSharedDependencies } from '../../utils/poetry';

/**
 * Generates a shared virtual environment in the root of the workspace. This includes the following:
 * - `pyproject.toml`: A pyproject.toml file with shared dependencies for all projects in the workspace.
 * - `poetry.toml`: A Poetry configuration file for the shared virtual environment.
 */
export default async function generator(tree: Tree) {
  process.chdir(tree.root);
  console.log(chalk.blue(`\n${chalk.bgBlue(' INFO ')} 🚀 Migrating to a shared virtual environment\n`));
  const config = JSON.parse(tree.read('package.json').toString());

  generateFiles(tree, path.join(__dirname, 'files'), '.', {
    projectName: config.name,
  });

  // Parse the TOML file and collect all dependencies from the workspace
  const rootTomlConfig = parse(tree.read('pyproject.toml').toString()) as PyProjectToml;

  console.log(chalk.dim(`Adding dependencies from ${workspaceLayout().appsDir}`));
  tree.children(workspaceLayout().appsDir).forEach((service) => {
    const projectTomlPath = path.join(workspaceLayout().appsDir, service, 'pyproject.toml');

    if (existsSync(projectTomlPath)) {
      console.log(chalk.dim(`Resolving dependencies for ${service}`));
      const projectTomlConfig = parse(tree.read(projectTomlPath).toString()) as PyProjectToml;
      addSharedDependencies(rootTomlConfig, projectTomlConfig);
    }
  });

  console.log(chalk.dim(`Adding dependencies from ${workspaceLayout().libsDir}`));
  tree.children(workspaceLayout().libsDir).forEach((lib) => {
    const projectTomlPath = path.join(workspaceLayout().libsDir, lib, 'pyproject.toml');

    if (existsSync(projectTomlPath)) {
      console.log(chalk.dim(`Resolving dependencies for ${lib}`));
      const projectTomlConfig = parse(tree.read(projectTomlPath).toString()) as PyProjectToml;
      addSharedDependencies(rootTomlConfig, projectTomlConfig);
    }
  });

  console.log(chalk.dim('Adding files for shared virtual environment\n'));
  tree.write('pyproject.toml', stringify(rootTomlConfig));

  await formatFiles(tree);
  return () => {
    installPackagesTask(tree);

    // Install the shared dependencies immediately
    runPoetry(['install --sync'], {
      cwd: tree.root,
      env: process.env,
    });
    console.log(
      chalk.green(`\n${chalk.bgGreen(' SUCCESS ')} 🎉 Successfully migrated to a shared virtual environment`),
    );
  };
}
