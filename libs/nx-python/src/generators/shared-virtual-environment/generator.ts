import type { PyProjectToml } from '../../utils/poetry';
import type { Tree } from '@nx/devkit';

import { formatFiles, generateFiles, installPackagesTask } from '@nx/devkit';
import { existsSync } from 'fs-extra';
import { parse, stringify } from '@iarna/toml';
import { runPoetry, addSharedDependencies } from '../../utils/poetry';
import path from 'path';
import chalk from 'chalk';

export default async function (tree: Tree) {
  process.chdir(tree.root);
  console.log(chalk.blue.bold(`\n🚀 Migrating to a shared virtual environment\n`));
  const config = JSON.parse(tree.read('package.json').toString());

  generateFiles(tree, path.join(__dirname, 'files'), '.', {
    projectName: config.name,
  });

  // Update dependencies in root pyproject.toml
  const rootTomlConfig = parse(tree.read('pyproject.toml').toString()) as PyProjectToml;

  console.log(chalk.bold('\nAdding dependencies from libs...'));
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

  console.log(chalk.bold('\nAdding dependencies from services...'));
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
