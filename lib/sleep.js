module.exports = function sleep(ms) {
  return new Promise(function(resolve) {
    setTimeout(resolve.bind(null, true), ms);
  });
};
