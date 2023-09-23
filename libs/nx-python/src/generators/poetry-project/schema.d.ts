export interface PoetryProjectGeneratorSchema {
  /**
   * Name of the project.
   */
  name: string;
  /**
   * Type of the project.
   * @default "application"
   */
  type: 'application' | 'library';
  /**
   * Description of the project.
   * @default ""
   */
  description: string;
}
