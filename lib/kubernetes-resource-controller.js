const KubernetesApiClient = require('kubernetes-api-client');
const Ajv = require('ajv');
const loadCustomResourceDefinition = require('./load-custom-resource-definition');
const createDefaultLogger = require('./create-default-logger');
const getCustomResourceSchema = require('./get-custom-resource-schema');
const sleep = require('./sleep');

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
    const eventId = `${resourceUid}.${type}`;

    if (this.processedResources[eventId] && (this.processedResources[eventId] >= resourceVersion)) {
      this.logger.debug(`Skip ${resourceId}#${eventId} v${resourceVersion} as is already processed`);
      return;
    }

    this.logger.debug(`Processing ${resourceId}#${eventId} v${resourceVersion}.`);

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

      this.processedResources[eventId] = resourceVersion;
      this.logger.debug(`Processed ${resourceId}#${eventId} v${resourceVersion}.`);

    } catch (e) {
      this.logger.warn(`Failed to process event ${type} ${resourceId}. Reason: ${e.message}`);
    }
  }

  async run() {
    try {
      await this.__registerResource();
      this.logger.info('Controller started');

      const {items} = await this.api.get(this.resource);
      for (const object of items) {
        await this.__handler({
          type: 'ADDED',
          object
        });
      }

      await this.api.watch(this.resource, this.__handler.bind(this));
      throw new Error('Unexpected termination of watch.');
    } catch (e) {
      this.logger.error('Controller terminated due to an error', e.stack);
      throw e;
    }
  }

  async __registerResource() {
    if (this.resourceDefinition) {
      const resourceId = this.resourceDefinition.metadata.name;
      try {
        this.logger.debug(`Registering ${resourceId}`);

        await this.api.post(
          'apis/apiextensions.k8s.io/v1beta1/customresourcedefinitions',
          this.resourceDefinition
        );

        await sleep(2000);
        this.logger.info(`Registered ${resourceId}`);
      } catch (e) {
        if (e.statusCode !== 409) {
          this.logger.debug(`Failed to register ${resourceId}`);
          throw e;
        }

        this.logger.debug(`${resourceId} already registered`);
      }
    }
  }
}

module.exports = KubernetesResourceController;
