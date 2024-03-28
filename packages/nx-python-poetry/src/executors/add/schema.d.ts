export interface AddExecutorSchema {
  /**
   * Additional arguments to pass to the add command.
   * @default undefined
   */
  args?: string;
  /**
   * The dependencies to install
   */
  dependencies: string[];
  /**
   * Whether the dependencies are local libraries
   * @default false
   */
  local: boolean;
}
