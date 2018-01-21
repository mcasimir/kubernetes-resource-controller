const KubernetesApiClient = require('kubernetes-api-client');
const Ajv = require('ajv');
const loadCustomResourceDefinition = require('./load-custom-resource-definition');
const createDefaultLogger = require('./create-default-logger');
const getCustomResourceSchema = require('./get-custom-resource-schema');

class KubernetesResourceController {
  constructor(resource, config = {}) {
    const {
      logger: loggerConfig = {},
      api: apiConfig = {},
      resourceDefinition
    } = config;

    this.resourceDefinition = resourceDefinition;

    if (typeof resourceDefinition === 'string') {
      this.resourceDefinition = loadCustomResourceDefinition(resourceDefinition);
    }

    this.resource = resource;
    this.api = new KubernetesApiClient(apiConfig);
    this.logger = loggerConfig.instance || createDefaultLogger(loggerConfig);
    this.config = config;
    this.processedResources = {};
  }

  added() {
    return Promise.resolve();
  }

  modified() {
    return Promise.resolve();
  }

  deleted() {
    return Promise.resolve();
  }

  __validate({spec, metadata} = {}) {
    const customResourceSchema = getCustomResourceSchema(this.resourceDefinition);

    if (customResourceSchema) {
      const ajv = new Ajv();
      ajv.addSchema(customResourceSchema, 'customResourceSchema');

      const valid = ajv.validate('customResourceSchema', spec);
      if (!valid) {
        const resourceId = `${metadata.name}.${metadata.namespace}`;

        this.logger.warn(`Validation failed for ${resourceId}:`,
          ajv.errorsText(), '.', JSON.stringify(ajv.errors));
        return false;
      }
    }

    return true;
  }

  async __handler(event) {
    const {type, object} = event;
    const {metadata = {}, spec = {}} = object;
    const resourceId = `${metadata.name}.${metadata.namespace}`;
    const resourceUid = metadata.uid;
    const resourceVersion = parseInt(metadata.resourceVersion);

    if (this.processedResources[resourceUid] && (this.processedResources[resourceUid] >= resourceVersion)) {
      this.logger.debug(`Skip ${resourceId}#${resourceUid} v${resourceVersion} as is already processed`);
      return;
    }

    this.logger.debug(`Processing ${resourceId}#${resourceUid} v${resourceVersion}.`);

    try {
      switch (type) {
      case 'ADDED':
        if (this.__validate(object)) {
          await this.added(metadata, spec);
        }

        break;
      case 'MODIFIED':
        if (this.__validate(object)) {
          await this.modified(metadata, spec);
        }

        break;
      case 'DELETED':
        await this.deleted(metadata, spec);
        break;
      default:
        this.logger.warn(`Unknown event type: ${type}`);
      }

      this.processedResources[resourceUid] = resourceVersion;
      this.logger.debug(`Processed ${resourceId}#${resourceUid} v${resourceVersion}.`);

    } catch (e) {
      this.logger.warn(`Failed to process event ${type} ${resourceId}. Reason: ${e.message}`);
    }
  }

  async run() {
    if (this.resourceDefinition) {
      try {
        await this.api.post(
          'apis/apiextensions.k8s.io/v1beta1/customresourcedefinitions',
          this.resourceDefinition
        );
      } catch (e) {
        if (e.statusCode !== 409) {
          throw e;
        }
      }
    }

    const {items} = await this.api.get(this.resource);
    for (const object of items) {
      await this.__handler({
        type: 'ADDED',
        object
      });
    }

    await this.api.watch(this.resource, this.__handler.bind(this));
  }
}

module.exports = KubernetesResourceController;