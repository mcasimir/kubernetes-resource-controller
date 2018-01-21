module.exports = function(crd) {
  try {
    return crd.spec.validation.openAPIV3Schema.properties.spec;
  } catch (e) {
    return null;
  }
};
