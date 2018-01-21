const KubernetesResourceController = require('../lib');

class CrdWatch extends KubernetesResourceController {
  constructor() {
    super('apis/mcasimir.github.com/v1/stuffs', {
      resourceDefinition: 'examples/crd.yaml'
    });
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

const controller = new CrdWatch();

controller.run().catch(function(err) {
  console.error(err);
  process.exit(1);
});
