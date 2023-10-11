import type { SpawnSyncOptions } from 'child_process';
import type { ExecutorContext, ProjectConfiguration } from '@nx/devkit';
import { readFileSync } from 'fs-extra';
import chalk from 'chalk';
import toml from '@iarna/toml';
import path from 'path';

import type { DevExecutorSchema } from './schema';
import type { PyProjectToml, PyProjectTomlNxConfig } from '../../utils/poetry';
import { checkPoetryExecutable, runPoetry, ServiceKind } from '../../utils/poetry';

/**
 * Starts the development server for the current project. Currently only supports FastAPI and gRPC.
 *
 * @param {DevExecutorSchema} options - Executor options
 * @param {ExecutorContext} context - Executor context
 * @throws {Error} - Unsupported service type
 * @returns {Promise<{ success: boolean }>} - Promise containing success status
 */
export default async function executor(
  options: DevExecutorSchema,
  context: ExecutorContext,
): Promise<{ success: boolean }> {
  process.chdir(context.root);

  try {
    await checkPoetryExecutable();
    const projectContext = context.projectsConfigurations.projects[context.projectName];
    console.log(chalk.blue(`\n${chalk.bgBlue(' INFO ')} 🚀 Starting development server for ${context.projectName}\n`));

    const nxDevConfig = getServiceType(projectContext);
    const projectName = projectContext.name.replace(/-/g, '_');

    const execOpts: SpawnSyncOptions = {
      cwd: projectContext.root,
      env: process.env,
    };

    // Start development server based on the type of project which invoked the executor. This is done inside
    // executor since there seems to be no better way of implementing HMR into gRPC services other than using
    // watchmedo to restart the server on file changes.
    switch (nxDevConfig.kind) {
      case ServiceKind.FAST_API:
        console.log(chalk.dim('Identified as FastAPI service, starting development server with uvicorn'));
        runPoetry(
          [
            'run',
            'uvicorn',
            `${projectName}.main:app`,
            '--port',
            nxDevConfig.port.toString(),
            '--host',
            nxDevConfig.host,
            '--reload',
          ],
          execOpts,
        );
        break;
      case ServiceKind.GRPC:
        console.log(chalk.dim('Identified as gRPC service, starting development server with watchmedo'));
        runPoetry(
          [
            'run',
            'watchmedo',
            'auto-restart',
            '--directory',
            projectName,
            '--pattern',
            '*.py',
            '--recursive',
            'python',
            `${projectName}/main.py`,
          ],
          execOpts,
        );
        break;
      default:
        throw new Error(`Unsupported service type: ${nxDevConfig}`);
    }

    console.log(
      chalk.green(`\n${chalk.bgGreen(' SUCCESS ')} 🎉 Successfully added dependencies to ${context.projectName}`),
    );
    return { success: true };
  } catch (error) {
    console.error(chalk.red(`\n${chalk.bgRed(' ERROR ')} ❌ Failed to add dependencies to ${context.projectName}`));
    console.error(chalk.red(`\n${error.message}`));
    return { success: false };
  }
}

/**
 * Checks for a nx configuration in the pyproject.toml file.
 *
 * @param {ProjectConfiguration} projectContext - Project configuration.
 * @throws {Error} - If nx configuration is missing.
 * @returns {PyProjectTomlNxConfig} - Nx configuration for development server.
 */
function getServiceType(projectContext: ProjectConfiguration): PyProjectTomlNxConfig {
  const projectTomlConfig = path.join(projectContext.root, 'pyproject.toml');
  const projectTomlData = toml.parse(readFileSync(projectTomlConfig, 'utf-8')) as PyProjectToml;

  console.log(chalk.dim('Checking nx configuration for development server'));
  if (projectTomlData.tool.nx === undefined) throw new Error('Missing NX configuration in pyproject.toml file');

  return projectTomlData.tool.nx;
}
