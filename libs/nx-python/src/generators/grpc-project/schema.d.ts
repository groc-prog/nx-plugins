import type { PoetryProjectGeneratorSchema } from '../poetry-project/schema';

export interface GRPCProjectGeneratorSchema extends Omit<PoetryProjectGeneratorSchema, 'type'> {
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
}
