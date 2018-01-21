const {writeFileSync, readFileSync} = require('fs');
const {resolve} = require('path');

module.exports = function installPlugin(release) {
  release.phases.start.before('commit', {
    name: 'bumpPackageLockJson',
    run(context) {
      const packageLockJsonPath = resolve(process.cwd(), 'package-lock.json');
      const packageJson = JSON.parse(readFileSync(packageLockJsonPath));
      packageJson.version = context.nextVersion;

      writeFileSync(
        packageLockJsonPath,
        JSON.stringify(packageJson, null, '  ') + '\n'
      );
    }
  });
};
