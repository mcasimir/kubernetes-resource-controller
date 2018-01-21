const bumpPackageLockJson = require('./release/bump-package-lock');
const npmPublish = require('./release/npm-publish');
module.exports = {
  developmentBranch: 'master',
  plugins: [
    'bump-package-json',
    bumpPackageLockJson,
    npmPublish
  ]
};
