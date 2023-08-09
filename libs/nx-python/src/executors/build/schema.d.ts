export interface BuildExecutorSchema {
  [key: string]: unknown;
  ignorePaths: string[];
  outputPath: string;
}
