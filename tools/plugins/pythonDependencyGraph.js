const { ProjectGraphBuilder } = require('@nx/devkit');
const { isObject } = require('lodash');
const path = require('path');
const fs = require('fs');
const toml = require('@iarna/toml');

exports.processProjectGraph = (graph, context) => {
  const builder = new ProjectGraphBuilder(graph);

  // Resolve dependencies between projects
  Object.keys(context.projectsConfigurations.projects).forEach((projectName) => {
    const project = context.projectsConfigurations.projects[projectName];
    const projectTomlConfig = path.resolve(__dirname, '..', '..', project.root, 'pyproject.toml');

    if (!fs.existsSync(projectTomlConfig)) return;

    const projectTomlData = toml.parse(fs.readFileSync(projectTomlConfig, 'utf-8'));

    Object.keys(projectTomlData.tool.poetry.dependencies).forEach((dependencyName) => {
      if (!isObject(projectTomlData.tool.poetry.dependencies[dependencyName])) return;

      builder.addImplicitDependency(projectName, dependencyName);
    });
  });

  return builder.getUpdatedProjectGraph();
};
