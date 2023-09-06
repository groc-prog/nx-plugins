import { ProjectGraph, ProjectGraphBuilder, ProjectGraphProcessorContext } from '@nx/devkit';

export function processProjectGraph(graph: ProjectGraph, context: ProjectGraphProcessorContext): ProjectGraph {
  const builder = new ProjectGraphBuilder(graph);
  console.log('HEREEEEEE');
  builder.addImplicitDependency('app-a', 'lib-a');
  return builder.getUpdatedProjectGraph();
}
