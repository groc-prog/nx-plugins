import type { SharedVirtualEnvironmentSchema } from './schema';

import { Tree, formatFiles, generateFiles, installPackagesTask } from '@nx/devkit';
import { existsSync } from 'fs-extra';
import { parse, stringify } from '@iarna/toml';
import path from 'path';
import { PyprojectToml } from '../../utils/poetry';
import { isObject } from 'lodash';

export default async function (tree: Tree, schema: SharedVirtualEnvironmentSchema) {
  const config = JSON.parse(tree.read('package.json').toString());

  generateFiles(tree, path.join(__dirname, 'files'), '.', {
    projectName: config.name,
    autoActivate: schema.autoActivate,
  });

  // Update dependencies in root pyproject.toml
  const rootPyProjectTomlData = parse(tree.read('pyproject.toml').toString()) as PyprojectToml;

  tree.children('libs').forEach((lib) => {
    const pyProjectTomlPath = path.join('libs', lib, 'pyproject.toml');

    if (existsSync(pyProjectTomlPath)) {
      // Get pyproject.toml file contents
      const pyProjectTomlData = parse(tree.read(pyProjectTomlPath).toString()) as PyprojectToml;

      Object.keys(pyProjectTomlData.tool.poetry.dependencies).forEach((dependencyName) => {
        const rootDependency = rootPyProjectTomlData.tool.poetry.dependencies[dependencyName];
        const projectDependency = pyProjectTomlData.tool.poetry.dependencies[dependencyName];

        // Check for dependency version mismatch
        if (rootDependency && projectDependency && rootDependency !== projectDependency)
          throw new Error(
            `Dependency version mismatch for ${dependencyName}. Got version ${projectDependency} in ${lib}
            and ${rootDependency} in shared virtual environment. Resolve the dependency conflict before proceeding.`
          );

        // Add dependency or local lib to root pyproject.toml
        if (isObject(projectDependency) && projectDependency.path) {
          pyProjectTomlData.tool.poetry.dependencies[dependencyName] = {
            path: `libs/${lib}`,
            develop: true,
          };
        } else {
          rootPyProjectTomlData.tool.poetry.dependencies[dependencyName] = projectDependency;
        }
      });
    }
  });

  tree.write('pyproject.toml', stringify(rootPyProjectTomlData));

  await formatFiles(tree);
  return () => {
    installPackagesTask(tree);
  };
}
