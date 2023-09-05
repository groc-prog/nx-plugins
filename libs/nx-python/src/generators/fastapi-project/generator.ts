import type { FastAPIProjectGeneratorSchema } from './schema.js';

import * as poetryGenerator from '../poetry-project/generator';
import path from 'path';
import { Tree, formatFiles, generateFiles, installPackagesTask, names, workspaceLayout } from '@nx/devkit';

export default async function generator(tree: Tree, schema: FastAPIProjectGeneratorSchema) {
  await poetryGenerator.default(tree, {
    ...schema,
    type: 'application',
  });

  const projectName = names(schema.name).fileName;
  const moduleName = projectName.replace('-', '_');

  generateFiles(tree, path.join(__dirname, 'files'), path.join(workspaceLayout().appsDir, projectName), {
    description: schema.description,
    projectName,
    moduleName,
    port: schema.port,
  });

  await formatFiles(tree);
  return () => {
    installPackagesTask(tree);
  };
}
