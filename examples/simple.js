const KubernetesResourceController = require('../lib');

class NamespaceWatch extends KubernetesResourceController {
  constructor() {
    super('api/v1/namespaces');
  }

  added(metadata) {
    this.logger.info('ADDED', metadata.name);
  }

  modified(metadata) {
    this.logger.info('MODIFIED', metadata.name);
  }

  deleted(metadata) {
    this.logger.info('DELETED', metadata.name);
  }
}

const controller = new NamespaceWatch();

controller.run().catch(function(err) {
  console.error(err);
  process.exit(1);
});
