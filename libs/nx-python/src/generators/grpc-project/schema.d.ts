export interface GRPCProjectGeneratorSchema {
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
   * Port to run the gRPC server on.
   * @default '50051'
   */
  port: string;
  /**
   * Host to run the gRPC server on.
   * @default '[::]'
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
