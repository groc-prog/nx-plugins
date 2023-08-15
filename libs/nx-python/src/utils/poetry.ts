import type { SpawnSyncOptions } from 'child_process';

import chalk from 'chalk';
import spawn from 'cross-spawn';
import commandExists from 'command-exists';

export type PyProjectTomlDependency =
  | string
  | {
      path?: string;
      develop?: boolean;
    };

export type PyProjectTomlDependencies = {
  [key: string]: PyProjectTomlDependency;
};

export type PyProjectToml = {
  tool?: {
    poetry?: {
      name: string;
      version: string;
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

export const POETRY_EXECUTABLE = 'poetry';

/**
 * Checks if Poetry is installed.
 *
 * @throws {Error} If Poetry is not installed.
 */
export async function checkPoetryExecutable(): Promise<void> {
  try {
    await commandExists(POETRY_EXECUTABLE);
  } catch (e) {
    throw new Error('Poetry is not installed. Please install Poetry before running this command.');
  }
}

/**
 * Run poetry with given arguments.
 *
 * @param {string[]} args - Arguments to pass to poetry.
 * @param {SpawnSyncOptions} options - Options to pass to spawn.
 */
export function runPoetry(args: string[], options: SpawnSyncOptions = {}): void {
  const commandStr = `${POETRY_EXECUTABLE} ${args.join(' ')}`;
  console.log(chalk`Running command {bold ${commandStr}}`);

  const result = spawn.sync(POETRY_EXECUTABLE, args, {
    ...options,
    shell: false,
    stdio: 'inherit',
    maxBuffer: 1024 * 1024 * 10,
  });

  if (result.status !== 0)
    throw new Error(chalk`{bold ${commandStr}} command failed with exit code {bold ${result.status}}`);
}

// export function checkSharedVenv(workspaceRoot: string): void {
//   const workspacePyProjectToml = path.join(workspaceRoot, 'pyproject.toml');

//   if (existsSync(workspacePyProjectToml)) {

//   }
// }
// export function activateVenv(workspaceRoot: string) {
//   if (!process.env.VIRTUAL_ENV) {
//     const rootPyproject = path.join(workspaceRoot, 'pyproject.toml');

//     if (fs.existsSync(rootPyproject)) {
//       const rootConfig = parse(fs.readFileSync(rootPyproject, 'utf-8')) as PyProjectToml;
//       const autoActivate = rootConfig.tool.nx?.autoActivate ?? false;
//       if (autoActivate) {
//         console.log(chalk`\n{bold shared virtual environment detected and not activated, activating...}\n\n`);
//         const virtualEnv = path.resolve(workspaceRoot, '.venv');
//         process.env.VIRTUAL_ENV = virtualEnv;
//         process.env.PATH = `${virtualEnv}/bin:${process.env.PATH}`;
//         delete process.env.PYTHONHOME;
//       }
//     }
//   }
// }
