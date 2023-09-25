import type { SpawnSyncOptions } from 'child_process';
import type { ExecutorContext, ProjectConfiguration } from '@nx/devkit';
import type { DevExecutorSchema } from './schema';
import type { PyProjectToml, PyProjectTomlNxConfig } from '../../utils/poetry';

import { checkPoetryExecutable, runPoetry, ServiceKind } from '../../utils/poetry';
import chalk from 'chalk';
import toml from '@iarna/toml';
import fs from 'fs';
import path from 'path';

export default async function executor(options: DevExecutorSchema, context: ExecutorContext) {
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
          execOpts
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
          execOpts
        );
        break;
      default:
        throw new Error(`Unsupported service type: ${nxDevConfig}`);
    }

    console.log(
      chalk.green(`\n${chalk.bgGreen(' SUCCESS ')} 🎉 Successfully added dependencies to ${context.projectName}`)
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
 * @returns {PyProjectTomlNxConfig} - Nx configuration for development server.
 */
function getServiceType(projectContext: ProjectConfiguration): PyProjectTomlNxConfig {
  const projectTomlConfig = path.join(projectContext.root, 'pyproject.toml');
  const projectTomlData = toml.parse(fs.readFileSync(projectTomlConfig, 'utf-8')) as PyProjectToml;

  console.log(chalk.dim('Checking nx configuration for development server'));
  if (projectTomlData.tool.nx === undefined) throw new Error('Missing NX configuration in pyproject.toml file');

  return projectTomlData.tool.nx;
}
