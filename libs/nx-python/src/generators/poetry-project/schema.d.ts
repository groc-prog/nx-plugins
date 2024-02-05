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
   * @default true
   */
  addBlack: boolean;
  /**
   * Whether to add Pylint for linting.
   * @default true
   */
  addPylint: boolean;
  /**
   * Whether to add Pytest for testing.
   * @default true
   */
  addPytest: boolean;
  /**
   * Whether to add Pyright for type checking.
   * @default true
   */
  addPyright: boolean;
  /**
   * Whether to add addIsort for import sorting.
   * @default true
   */
  addIsort: boolean;
}
