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
  /**
   * Whether to add Black for code formatting.
   * @default false
   */
  addBlack: boolean;
  /**
   * Whether to add Pylint for linting.
   * @default false
   */
  addPylint: boolean;
  /**
   * Whether to add Pytest for testing.
   * @default false
   */
  addPytest: boolean;
  /**
   * Whether to add Pyright for type checking.
   * @default false
   */
  addPyright: boolean;
  /**
   * Whether to add addIsort for import sorting.
   * @default false
   */
  addIsort: boolean;
  /**
   * Whether to add a Dockerfile for the project.
   * @default false
   */
  addDockerfile: boolean;
}
