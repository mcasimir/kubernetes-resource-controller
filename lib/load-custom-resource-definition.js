const {readFileSync} = require('fs');
const yaml = require('js-yaml');

module.exports = function loadCustomResourceDefinition(customResourceDefinitionPath) {
  const resourceDefinitionSrc = readFileSync(customResourceDefinitionPath, 'utf-8');
  return customResourceDefinitionPath.endsWith('.json') ?
    JSON.parse(resourceDefinitionSrc) : yaml.safeLoad(resourceDefinitionSrc);
};
