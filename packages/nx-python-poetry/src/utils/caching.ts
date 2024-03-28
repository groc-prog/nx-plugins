/**
 * Returns a list of default cache inputs for the given project Poetry name.
 *
 * @param {string} moduleName - The name of the module
 * @returns {string[]} A list of files to cache
 */
export function getDefaultCacheInputs(moduleName: string): string[] {
  return [
    `{projectRoot}/${moduleName}/**/*`,
    `{projectRoot}/${moduleName}/**/_*`,
    `{projectRoot}/pyproject.toml`,
    `{projectRoot}/poetry.lock`,
    `{projectRoot}/poetry.toml`,
    `{projectRoot}/project.json`,
    '!{projectRoot}/*.md',
    '!{projectRoot}/Dockerfile',
    '!{projectRoot}/.venv',
  ];
}
