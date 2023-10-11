export interface FastAPIProjectGeneratorSchema {
  /**
   * Name of the project.
   */
  name: string;
  /**
   * Description of the project.
   * @default ''
   */
  description: string;
  /**
   * Port to run the FastAPI server on.
   * @default '8000'
   */
  port: string;
  /**
   * Host to run the FastAPI server on.
   */
  host: string;
  /**
   * Whether to include a Dockerfile.
   * @default true
   */
  includeDockerFile: boolean;
  /**
   * Options inherited from the Poetry project generator.
   * @see {@link libs/nx-python/src/generators/poetry-project/schema.d.ts}
   */
  addBlack: boolean;
  addPylint: boolean;
  addPytest: boolean;
  addPyright: boolean;
}
