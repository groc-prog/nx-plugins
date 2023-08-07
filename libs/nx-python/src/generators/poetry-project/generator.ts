import {
  addProjectConfiguration,
  formatFiles,
  generateFiles,
  getWorkspaceLayout,
  names,
  offsetFromRoot,
  ProjectConfiguration,
  Tree,
} from '@nx/devkit';
import * as path from 'path';
import { PoetryProjectGeneratorSchema } from './schema';
import { checkPoetryExecutable, runPoetry } from '../../executors/utils/poetry';
import { PyprojectToml } from '../../graph/dependency-graph';
import { parse, stringify } from '@iarna/toml';
import chalk from 'chalk';
import _ from 'lodash';

interface NormalizedSchema extends PoetryProjectGeneratorSchema {
  packageName: string;
  projectName: string;
  projectRoot: string;
  moduleName: string;
  individualPackage: boolean;
  projectDirectory: string;
  parsedTags: string[];
}

function normalizeOptions(tree: Tree, options: PoetryProjectGeneratorSchema): NormalizedSchema {
  const projectDirectory = names(options.name).fileName;
  const moduleName = projectDirectory.replace(/-/g, '_');
  const projectRoot = `${
    options.projectType === 'application' ? getWorkspaceLayout(tree).appsDir : getWorkspaceLayout(tree).libsDir
  }/${projectDirectory}`;
  const parsedTags = options.tags ? options.tags.split(',').map((s) => s.trim()) : [];

  const newOptions = {
    ...(_.clone(options) as NormalizedSchema),
    moduleName,
    packageName: projectDirectory,
    description: options.description || '',
    individualPackage: !tree.exists('pyproject.toml'),
  };

  return {
    ...options,
    ...newOptions,
    projectName: projectDirectory,
    projectRoot,
    projectDirectory,
    parsedTags,
  };
}

function addFiles(tree: Tree, options: NormalizedSchema) {
  const templateOptions = {
    ...options,
    ...names(options.name),
    offsetFromRoot: offsetFromRoot(options.projectRoot),
    template: '',
    dot: '.',
  };

  generateFiles(tree, path.join(__dirname, 'files'), options.projectRoot, templateOptions);
}

function updateRootPyprojectToml(host: Tree, normalizedOptions: NormalizedSchema) {
  if (!normalizedOptions.individualPackage) {
    const rootPyprojectToml = parse(host.read('./pyproject.toml', 'utf-8')) as PyprojectToml;

    const group = normalizedOptions.rootPyprojectDependencyGroup ?? 'main';

    if (group === 'main') {
      rootPyprojectToml.tool.poetry.dependencies[normalizedOptions.packageName] = {
        path: normalizedOptions.projectRoot,
        develop: true,
      };
    } else {
      rootPyprojectToml.tool.poetry.group = {
        ...(rootPyprojectToml.tool.poetry.group || {}),
        [group]: {
          ...(rootPyprojectToml.tool.poetry.group?.[group] || {}),
          dependencies: {
            ...(rootPyprojectToml.tool.poetry.group?.[group]?.dependencies || {}),
            [normalizedOptions.packageName]: {
              path: normalizedOptions.projectRoot,
              develop: true,
            },
          },
        },
      };
    }

    host.write('./pyproject.toml', stringify(rootPyprojectToml));
  }
}

function updateRootPoetryLock(host: Tree) {
  if (host.exists('./pyproject.toml')) {
    console.log(chalk`  Updating root {bgBlue poetry.lock}...`);
    runPoetry(['lock', '--no-update'], { log: false });
    runPoetry(['install']);
    console.log(chalk`\n  {bgBlue poetry.lock} updated.\n`);
  }
}

export default async function (tree: Tree, options: PoetryProjectGeneratorSchema) {
  await checkPoetryExecutable();

  const normalizedOptions = normalizeOptions(tree, options);

  const targets: ProjectConfiguration['targets'] = {
    lock: {
      executor: '@pymonorepo/nx-python:run-commands',
      options: {
        command: 'poetry lock --no-update',
        cwd: normalizedOptions.projectRoot,
      },
    },
    add: {
      executor: '@pymonorepo/nx-python:add',
      options: {},
    },
    update: {
      executor: '@pymonorepo/nx-python:update',
      options: {},
    },
    remove: {
      executor: '@pymonorepo/nx-python:remove',
      options: {},
    },
    build: {
      executor: '@pymonorepo/nx-python:build',
      outputs: ['{projectRoot}/dist'],
      options: {
        outputPath: `${normalizedOptions.projectRoot}/dist`,
        publish: false,
        lockedVersions: normalizedOptions.buildLockedVersions,
        bundleLocalDependencies: normalizedOptions.buildBundleLocalDependencies,
      },
    },
    install: {
      executor: '@pymonorepo/nx-python:install',
      options: {
        silent: false,
        args: '',
        cacheDir: `.cache/pypoetry`,
        verbose: false,
        debug: false,
      },
    },
  };

  addProjectConfiguration(tree, normalizedOptions.projectName, {
    root: normalizedOptions.projectRoot,
    projectType: normalizedOptions.projectType,
    sourceRoot: `${normalizedOptions.projectRoot}/${normalizedOptions.moduleName}`,
    targets,
    tags: normalizedOptions.parsedTags,
  });
  addFiles(tree, normalizedOptions);
  updateRootPyprojectToml(tree, normalizedOptions);
  await formatFiles(tree);

  return () => {
    updateRootPoetryLock(tree);
  };
}
