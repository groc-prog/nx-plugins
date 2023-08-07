export interface PoetryProjectGeneratorSchema {
  name: string;
  projectType: 'application' | 'library';
  description?: string;
  buildLockedVersions: boolean;
  buildBundleLocalDependencies: boolean;
  rootPyprojectDependencyGroup: string;
  tags?: string;
}
