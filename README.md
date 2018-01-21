# Kubernetes Api Client for Node.js

## Install

```
npm install --save kubernetes-resource-controller
```

## Usage

### Standard resources

``` js
const KubernetesController = require('kubernetes-resource-controller');

class RegsecretCreator extends KubernetesController {
  constructor(options) {
    super('v1/namespaces', options);
  }

  async added(metadata, spec) {
    try {
      await this.api.post(`v1/secrets`, {
        metadata: {
          name: 'regsecret',
          namespace: metadata.name
        },
        type: 'kubernetes.io/dockercfg',
        data: '... base64Data ...'
      });
    } catch (e) {
      if (e.statusCode !== 409) {
        throw e;
      }
    }
  }
}

controller.run()
  .catch(function(err) {
    console.error(err);
    process.exit(1);
  });
```

### Custom resources

``` js
const KubernetesController = require('kubernetes-resource-controller');

class CustomResourceController extends KubernetesController {
  constructor(options = {}) {
    super(
      'my.api.com/v1/something',
      Object.assign(options, {
        resourceDefinitionPath: 'something.yaml'
      })
    );
  }

  async added(metadata, spec) {
    // ...
  }

  async modified(metadata, spec) {
    // ...
  }

  async deleted(metadata, spec) {
    // ...
  }
}
```
<!-- toc -->
<!-- tocstop -->

## Getting Started

<!--START docs -->
<!--END docs -->
