export interface RemoveExecutorSchema {
  [key: string]: unknown;
  dependencies: string[];
  local: boolean;
}
