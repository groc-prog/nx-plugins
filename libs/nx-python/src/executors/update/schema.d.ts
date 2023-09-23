export interface UpdateExecutorSchema {
  [key: string]: unknown;
  /**
   * The dependencies to update
   */
  dependencies: string[];
}
