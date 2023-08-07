import { spawnSyncMock } from '../../utils/mocks/cross-spawn.mock';
import * as poetryUtils from '../../executors/utils/poetry';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import { Tree, readProjectConfiguration } from '@nx/devkit';

import generator from './generator';
import { PoetryProjectGeneratorSchema } from './schema';
import dedent from 'string-dedent';
import { parse, stringify } from '@iarna/toml';
import { PyprojectToml } from '../../graph/dependency-graph';
import path from 'path';

describe('application generator', () => {
  let checkPoetryExecutableMock: jest.SpyInstance;
  let appTree: Tree;
  const options: PoetryProjectGeneratorSchema = {
    name: 'test',
    projectType: 'application',
    pyprojectPythonDependency: '',
    pyenvPythonVersion: '',
    publishable: false,
    buildLockedVersions: false,
    buildBundleLocalDependencies: false,
    linter: 'none',
    unitTestRunner: 'none',
    rootPyprojectDependencyGroup: 'main',
    unitTestHtmlReport: false,
    unitTestJUnitReport: false,
    codeCoverage: false,
    codeCoverageHtmlReport: false,
    codeCoverageXmlReport: false,
  };

  beforeEach(() => {
    jest.resetAllMocks();

    appTree = createTreeWithEmptyWorkspace({ layout: 'apps-libs' });
    checkPoetryExecutableMock = jest.spyOn(
      poetryUtils,
      'checkPoetryExecutable'
    );
    checkPoetryExecutableMock.mockResolvedValue(undefined);
    spawnSyncMock.mockReturnValue({ status: 0 });
  });

  it('should throw an exception when the poetry is not installed', async () => {
    checkPoetryExecutableMock.mockRejectedValue(new Error('poetry not found'));

    expect(generator(appTree, options)).rejects.toThrow('poetry not found');

    expect(checkPoetryExecutableMock).toHaveBeenCalled();
  });

  describe('individual package', () => {
    it('should run successfully minimal configuration', async () => {
      await generator(appTree, options);
      const config = readProjectConfiguration(appTree, 'test');
      expect(config).toMatchSnapshot();

      const projectDirectory = 'apps/test';
      const moduleName = 'test';

      assertGeneratedFilesBase(appTree, projectDirectory, moduleName);

      expect(appTree.exists(`${projectDirectory}/.flake8`)).toBeFalsy();
      expect(
        appTree.exists(`${projectDirectory}/tests/test_hello.py`)
      ).toBeFalsy();
    });

    it('should run successfully minimal configuration as a library', async () => {
      await generator(appTree, {
        ...options,
        projectType: 'library',
      });
      const config = readProjectConfiguration(appTree, 'test');
      expect(config).toMatchSnapshot();

      const projectDirectory = 'libs/test';
      const moduleName = 'test';

      assertGeneratedFilesBase(appTree, projectDirectory, moduleName);

      expect(appTree.exists(`${projectDirectory}/.flake8`)).toBeFalsy();
      expect(
        appTree.exists(`${projectDirectory}/tests/test_hello.py`)
      ).toBeFalsy();
    });

    it('should run successfully minimal configuration with tags', async () => {
      await generator(appTree, {
        ...options,
        tags: 'one,two',
      });
      const config = readProjectConfiguration(appTree, 'test');
      expect(config).toMatchSnapshot();

      const projectDirectory = 'apps/test';
      const moduleName = 'test';

      assertGeneratedFilesBase(appTree, projectDirectory, moduleName);
    });

    it('should run successfully minimal configuration custom directory', async () => {
      await generator(appTree, {
        ...options,
        directory: 'subdir',
      });
      const config = readProjectConfiguration(appTree, 'subdir-test');
      expect(config).toMatchSnapshot();

      const projectDirectory = 'apps/subdir/test';
      const moduleName = 'subdir_test';

      assertGeneratedFilesBase(appTree, projectDirectory, moduleName);
    });

    it('should run successfully with flake8 linter', async () => {
      await generator(appTree, {
        ...options,
        linter: 'flake8',
      });
      const config = readProjectConfiguration(appTree, 'test');
      expect(config).toMatchSnapshot();

      assertGeneratedFilesBase(appTree, 'apps/test', 'test');
      assertGeneratedFilesFlake8(appTree, 'apps/test');
    });

    it('should run successfully with flake8 linter and pytest with no reports', async () => {
      await generator(appTree, {
        ...options,
        linter: 'flake8',
        unitTestRunner: 'pytest',
      });
      const config = readProjectConfiguration(appTree, 'test');
      expect(config).toMatchSnapshot();

      assertGeneratedFilesBase(appTree, 'apps/test', 'test');
      assertGeneratedFilesFlake8(appTree, 'apps/test');
      assertGeneratedFilesPyTest(appTree, 'apps/test');
    });

    it('should run successfully with flake8 linter and pytest with no reports', async () => {
      await generator(appTree, {
        ...options,
        linter: 'flake8',
        unitTestRunner: 'pytest',
      });
      const config = readProjectConfiguration(appTree, 'test');
      expect(config).toMatchSnapshot();

      assertGeneratedFilesBase(appTree, 'apps/test', 'test');
      assertGeneratedFilesFlake8(appTree, 'apps/test');
      assertGeneratedFilesPyTest(appTree, 'apps/test');
    });

    it('should run successfully with flake8 linter and pytest with html coverage report', async () => {
      await generator(appTree, {
        ...options,
        linter: 'flake8',
        unitTestRunner: 'pytest',
        codeCoverage: true,
        codeCoverageHtmlReport: true,
      });
      const config = readProjectConfiguration(appTree, 'test');
      expect(config).toMatchSnapshot();

      assertGeneratedFilesBase(appTree, 'apps/test', 'test');
      assertGeneratedFilesFlake8(appTree, 'apps/test');
      assertGeneratedFilesPyTest(appTree, 'apps/test');
    });

    it('should run successfully with flake8 linter and pytest with html,xml coverage reports', async () => {
      await generator(appTree, {
        ...options,
        linter: 'flake8',
        unitTestRunner: 'pytest',
        codeCoverage: true,
        codeCoverageHtmlReport: true,
        codeCoverageXmlReport: true,
      });
      const config = readProjectConfiguration(appTree, 'test');
      expect(config).toMatchSnapshot();

      assertGeneratedFilesBase(appTree, 'apps/test', 'test');
      assertGeneratedFilesFlake8(appTree, 'apps/test');
      assertGeneratedFilesPyTest(appTree, 'apps/test');
    });

    it('should run successfully with flake8 linter and pytest with html,xml coverage reports and threshold', async () => {
      await generator(appTree, {
        ...options,
        linter: 'flake8',
        unitTestRunner: 'pytest',
        codeCoverage: true,
        codeCoverageHtmlReport: true,
        codeCoverageXmlReport: true,
        codeCoverageThreshold: 100,
      });
      const config = readProjectConfiguration(appTree, 'test');
      expect(config).toMatchSnapshot();

      assertGeneratedFilesBase(appTree, 'apps/test', 'test');
      assertGeneratedFilesFlake8(appTree, 'apps/test');
      assertGeneratedFilesPyTest(appTree, 'apps/test');
    });

    it('should run successfully with flake8 linter and pytest with html,xml coverage reports, threshold and junit report', async () => {
      await generator(appTree, {
        ...options,
        linter: 'flake8',
        unitTestRunner: 'pytest',
        codeCoverage: true,
        codeCoverageHtmlReport: true,
        codeCoverageXmlReport: true,
        codeCoverageThreshold: 100,
        unitTestJUnitReport: true,
      });
      const config = readProjectConfiguration(appTree, 'test');
      expect(config).toMatchSnapshot();

      assertGeneratedFilesBase(appTree, 'apps/test', 'test');
      assertGeneratedFilesFlake8(appTree, 'apps/test');
      assertGeneratedFilesPyTest(appTree, 'apps/test');
    });

    it('should run successfully with flake8 linter and pytest with html,xml coverage reports, threshold and junit,html report', async () => {
      await generator(appTree, {
        ...options,
        linter: 'flake8',
        unitTestRunner: 'pytest',
        codeCoverage: true,
        codeCoverageHtmlReport: true,
        codeCoverageXmlReport: true,
        codeCoverageThreshold: 100,
        unitTestJUnitReport: true,
        unitTestHtmlReport: true,
      });
      const config = readProjectConfiguration(appTree, 'test');
      expect(config).toMatchSnapshot();

      assertGeneratedFilesBase(appTree, 'apps/test', 'test');
      assertGeneratedFilesFlake8(appTree, 'apps/test');
      assertGeneratedFilesPyTest(appTree, 'apps/test');
    });

    it('should run successfully with linting and testing options with a dev dependency project', async () => {
      await generator(appTree, {
        ...options,
        projectType: 'library',
        name: 'dev-lib',
        directory: 'shared',
      });

      await generator(appTree, {
        ...options,
        linter: 'flake8',
        unitTestRunner: 'pytest',
        codeCoverage: true,
        codeCoverageHtmlReport: true,
        codeCoverageXmlReport: true,
        codeCoverageThreshold: 100,
        unitTestJUnitReport: true,
        unitTestHtmlReport: true,
        devDependenciesProject: 'shared-dev-lib',
      });

      const config = readProjectConfiguration(appTree, 'test');
      expect(config).toMatchSnapshot();

      assertGeneratedFilesBase(appTree, 'apps/test', 'test');
      assertGeneratedFilesFlake8(appTree, 'apps/test');
      assertGeneratedFilesPyTest(appTree, 'apps/test');

      assertGeneratedFilesBase(
        appTree,
        'libs/shared/dev-lib',
        'shared_dev_lib'
      );
    });

    it('should run successfully with linting and testing options with a dev dependency project with custom package name', async () => {
      await generator(appTree, {
        ...options,
        projectType: 'library',
        name: 'dev-lib',
        directory: 'shared',
        packageName: 'custom-shared-dev-lib',
      });

      await generator(appTree, {
        ...options,
        linter: 'flake8',
        unitTestRunner: 'pytest',
        codeCoverage: true,
        codeCoverageHtmlReport: true,
        codeCoverageXmlReport: true,
        codeCoverageThreshold: 100,
        unitTestJUnitReport: true,
        unitTestHtmlReport: true,
        devDependenciesProject: 'shared-dev-lib',
      });

      expect(appTree.exists(`apps/test/pyproject.toml`)).toBeTruthy();
      expect(
        appTree.read(`apps/test/pyproject.toml`, 'utf8')
      ).toMatchSnapshot();
    });

    it('should run successfully with linting and testing options with an existing dev dependency project', async () => {
      await generator(appTree, {
        ...options,
        projectType: 'library',
        name: 'dev-lib',
        directory: 'shared',
      });

      const pyprojectToml = parse(
        appTree.read('libs/shared/dev-lib/pyproject.toml', 'utf-8')
      ) as PyprojectToml;

      pyprojectToml.tool.poetry.dependencies = {
        python: '>=3.9,<3.11',
        autopep8: '^1.0.0',
        pytest: '^1.0.0',
        'pytest-sugar': '^1.0.0',
        'pytest-cov': '^1.0.0',
        'pytest-html': '^1.0.0',
        flake8: '^1.0.0',
        'flake8-isort': '^1.0.0',
      };

      appTree.write(
        'libs/shared/dev-lib/pyproject.toml',
        stringify(pyprojectToml)
      );

      await generator(appTree, {
        ...options,
        linter: 'flake8',
        unitTestRunner: 'pytest',
        codeCoverage: true,
        codeCoverageHtmlReport: true,
        codeCoverageXmlReport: true,
        codeCoverageThreshold: 100,
        unitTestJUnitReport: true,
        unitTestHtmlReport: true,
        devDependenciesProject: 'shared-dev-lib',
      });

      const config = readProjectConfiguration(appTree, 'test');
      expect(config).toMatchSnapshot();

      assertGeneratedFilesBase(appTree, 'apps/test', 'test');
      assertGeneratedFilesFlake8(appTree, 'apps/test');
      assertGeneratedFilesPyTest(appTree, 'apps/test');

      assertGeneratedFilesBase(
        appTree,
        'libs/shared/dev-lib',
        'shared_dev_lib'
      );
    });
  });

  describe('shared virtual environment', () => {
    it('should run successfully with minimal options', async () => {
      appTree.write(
        'pyproject.toml',
        dedent`
      [tool.poetry]
      name = "workspace"

        [tool.poetry.dependencies]
        python = ">=3.9,<3.11"

      [build-system]
      requires = ["poetry-core"]
      build-backend = "poetry.core.masonry.api"
      `
      );

      const callbackTask = await generator(appTree, options);
      callbackTask();
      const config = readProjectConfiguration(appTree, 'test');
      expect(config).toMatchSnapshot();

      const projectDirectory = 'apps/test';
      const moduleName = 'test';

      assertGeneratedFilesBase(appTree, projectDirectory, moduleName);

      expect(appTree.exists(`${projectDirectory}/.flake8`)).toBeFalsy();
      expect(
        appTree.exists(`${projectDirectory}/tests/test_hello.py`)
      ).toBeFalsy();

      expect(appTree.read('pyproject.toml', 'utf-8')).toMatchSnapshot();

      expect(spawnSyncMock).toHaveBeenCalledTimes(2);
      expect(spawnSyncMock).toHaveBeenNthCalledWith(
        1,
        'poetry',
        ['lock', '--no-update'],
        {
          shell: false,
          stdio: 'inherit',
        }
      );
      expect(spawnSyncMock).toHaveBeenNthCalledWith(2, 'poetry', ['install'], {
        shell: false,
        stdio: 'inherit',
      });
    });

    it('should run successfully with minimal options without rootPyprojectDependencyGroup', async () => {
      appTree.write(
        'pyproject.toml',
        dedent`
      [tool.poetry]
      name = "workspace"

        [tool.poetry.dependencies]
        python = ">=3.9,<3.11"

      [build-system]
      requires = ["poetry-core"]
      build-backend = "poetry.core.masonry.api"
      `
      );

      const callbackTask = await generator(appTree, {
        ...options,
        rootPyprojectDependencyGroup: undefined,
      });
      callbackTask();
      const config = readProjectConfiguration(appTree, 'test');
      expect(config).toMatchSnapshot();

      const projectDirectory = 'apps/test';
      const moduleName = 'test';

      assertGeneratedFilesBase(appTree, projectDirectory, moduleName);

      expect(appTree.exists(`${projectDirectory}/.flake8`)).toBeFalsy();
      expect(
        appTree.exists(`${projectDirectory}/tests/test_hello.py`)
      ).toBeFalsy();

      expect(appTree.read('pyproject.toml', 'utf-8')).toMatchSnapshot();

      expect(spawnSyncMock).toHaveBeenCalledTimes(2);
      expect(spawnSyncMock).toHaveBeenNthCalledWith(
        1,
        'poetry',
        ['lock', '--no-update'],
        {
          shell: false,
          stdio: 'inherit',
        }
      );
      expect(spawnSyncMock).toHaveBeenNthCalledWith(2, 'poetry', ['install'], {
        shell: false,
        stdio: 'inherit',
      });
    });

    it('should run successfully with minimal options with custom rootPyprojectDependencyGroup', async () => {
      appTree.write(
        'pyproject.toml',
        dedent`
      [tool.poetry]
      name = "workspace"

        [tool.poetry.dependencies]
        python = ">=3.9,<3.11"

      [build-system]
      requires = ["poetry-core"]
      build-backend = "poetry.core.masonry.api"
      `
      );

      const callbackTask = await generator(appTree, {
        ...options,
        rootPyprojectDependencyGroup: 'dev',
      });
      callbackTask();
      const config = readProjectConfiguration(appTree, 'test');
      expect(config).toMatchSnapshot();

      const projectDirectory = 'apps/test';
      const moduleName = 'test';

      assertGeneratedFilesBase(appTree, projectDirectory, moduleName);

      expect(appTree.exists(`${projectDirectory}/.flake8`)).toBeFalsy();
      expect(
        appTree.exists(`${projectDirectory}/tests/test_hello.py`)
      ).toBeFalsy();

      expect(appTree.read('pyproject.toml', 'utf-8')).toMatchSnapshot();

      expect(spawnSyncMock).toHaveBeenCalledTimes(2);
      expect(spawnSyncMock).toHaveBeenNthCalledWith(
        1,
        'poetry',
        ['lock', '--no-update'],
        {
          shell: false,
          stdio: 'inherit',
        }
      );
      expect(spawnSyncMock).toHaveBeenNthCalledWith(2, 'poetry', ['install'], {
        shell: false,
        stdio: 'inherit',
      });
    });

    it('should run successfully with minimal options with existing custom rootPyprojectDependencyGroup', async () => {
      appTree.write(
        'pyproject.toml',
        dedent`
      [tool.poetry]
      name = "workspace"

        [tool.poetry.dependencies]
        python = ">=3.9,<3.11"

        [tool.poetry.group.dev.dependencies]
        flake8 = "6.0.0"

      [build-system]
      requires = ["poetry-core"]
      build-backend = "poetry.core.masonry.api"
      `
      );

      const callbackTask = await generator(appTree, {
        ...options,
        rootPyprojectDependencyGroup: 'dev',
      });
      callbackTask();
      const config = readProjectConfiguration(appTree, 'test');
      expect(config).toMatchSnapshot();

      const projectDirectory = 'apps/test';
      const moduleName = 'test';

      assertGeneratedFilesBase(appTree, projectDirectory, moduleName);

      expect(appTree.exists(`${projectDirectory}/.flake8`)).toBeFalsy();
      expect(
        appTree.exists(`${projectDirectory}/tests/test_hello.py`)
      ).toBeFalsy();

      expect(appTree.read('pyproject.toml', 'utf-8')).toMatchSnapshot();

      expect(spawnSyncMock).toHaveBeenCalledTimes(2);
      expect(spawnSyncMock).toHaveBeenNthCalledWith(
        1,
        'poetry',
        ['lock', '--no-update'],
        {
          shell: false,
          stdio: 'inherit',
        }
      );
      expect(spawnSyncMock).toHaveBeenNthCalledWith(2, 'poetry', ['install'], {
        shell: false,
        stdio: 'inherit',
      });
    });
  });

  describe('custom template dir', () => {
    it('should run successfully with custom template dir', async () => {
      await generator(appTree, {
        ...options,
        templateDir: path.join(__dirname, '__test__/custom-template'),
      });
      const config = readProjectConfiguration(appTree, 'test');
      expect(config).toMatchSnapshot();

      expect(
        appTree.read('apps/test/pyproject.toml', 'utf-8')
      ).toMatchSnapshot();

      expect(appTree.read('apps/test/poetry.toml', 'utf-8')).toMatchSnapshot();
    });
  });
});

function assertGeneratedFilesBase(
  appTree: Tree,
  projectDirectory: string,
  moduleName: string
) {
  expect(appTree.exists(`${projectDirectory}/README.md`)).toBeTruthy();
  expect(
    appTree.read(`${projectDirectory}/README.md`, 'utf8')
  ).toMatchSnapshot();

  expect(appTree.exists(`${projectDirectory}/pyproject.toml`)).toBeTruthy();
  expect(
    appTree.read(`${projectDirectory}/pyproject.toml`, 'utf8')
  ).toMatchSnapshot();

  expect(
    appTree.exists(`${projectDirectory}/${moduleName}/hello.py`)
  ).toBeTruthy();

  expect(
    appTree.read(`${projectDirectory}/${moduleName}/hello.py`, 'utf-8')
  ).toMatchSnapshot();

  expect(
    appTree.read(`${projectDirectory}/.python-version`, 'utf-8')
  ).toMatchSnapshot();
}

function assertGeneratedFilesFlake8(appTree: Tree, projectDirectory: string) {
  expect(appTree.exists(`${projectDirectory}/.flake8`)).toBeTruthy();
  expect(
    appTree.read(`${projectDirectory}/.flake8`, 'utf-8')
  ).toMatchSnapshot();
}

function assertGeneratedFilesPyTest(appTree: Tree, projectDirectory: string) {
  expect(
    appTree.exists(`${projectDirectory}/tests/test_hello.py`)
  ).toBeTruthy();

  expect(
    appTree.read(`${projectDirectory}/tests/test_hello.py`, 'utf-8')
  ).toMatchSnapshot();
}
