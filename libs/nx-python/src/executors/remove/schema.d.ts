export interface RemoveExecutorSchema {
  [key: string]: unknown;
  /**
   * The dependencies to remove
   */
  dependencies: string[];
  /**
   * Whether the dependencies are local libraries
   * @default false
   */
  local: boolean;
}
