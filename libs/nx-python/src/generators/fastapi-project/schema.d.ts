import type { PoetryProjectGeneratorSchema } from '../poetry-project/schema';

export interface FastAPIProjectGeneratorSchema extends Omit<PoetryProjectGeneratorSchema, 'type'> {
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
}
