export interface PoetryProjectGeneratorSchema {
  name: string;
  type: 'application' | 'library';
  description?: string;
}
