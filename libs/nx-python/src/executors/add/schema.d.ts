export interface AddExecutorSchema {
  [key: string]: unknown;
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
