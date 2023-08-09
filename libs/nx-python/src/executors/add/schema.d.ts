export interface AddExecutorSchema {
  [key: string]: unknown;
  dependencies: string[];
  local: boolean;
}
