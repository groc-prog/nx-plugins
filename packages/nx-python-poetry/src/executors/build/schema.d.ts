export interface BuildExecutorSchema {
  /**
   * Paths to files/directories which will be ignored in the build step.
   * @default []
   */
  ignorePaths: string[];
}
