const {execSync} = require('child_process');

module.exports = function installPlugin(release) {
  release.phases.finish.steps.push({
    name: 'npmPublish',
    run() {
      console.info(execSync('npm publish'));
    }
  });
};
