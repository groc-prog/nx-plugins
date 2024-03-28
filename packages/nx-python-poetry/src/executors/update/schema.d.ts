export interface UpdateExecutorSchema {
  /**
   * Additional arguments to pass to the update command.
   * @default undefined
   */
  args?: string;
  /**
   * The dependencies to update
   */
  dependencies: string[];
}
