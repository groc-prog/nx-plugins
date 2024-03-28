export interface RemoveExecutorSchema {
  /**
   * The dependencies to remove
   */
  dependencies: string[];
  /**
   * Whether the dependencies are local libraries
   * @default false
   */
  local: boolean;
  /**
   * Additional arguments to pass to the remove command.
   * @default undefined
   */
  args?: string;
}
