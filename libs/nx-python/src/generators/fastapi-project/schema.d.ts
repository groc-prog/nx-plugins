export interface FastAPIProjectGeneratorSchema {
  name: string;
  description: string;
  port: number;
  includeDockerFile: boolean;
}
