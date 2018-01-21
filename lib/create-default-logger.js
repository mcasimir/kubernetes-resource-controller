module.exports = function createDefaultLogger({
  silent = false,
  format = 'json',
  colorize = false,
  level = 'info'
}) {
  const {Logger, transports} = require('winston');

  const prettyPrint = format === 'pretty';
  const json = format !== 'pretty';

  const logger = new Logger({
    level,
    transports: [
      new transports.Console({
        silent,
        json,
        stringify: json,
        prettyPrint,
        colorize
      })
    ]
  });

  return logger;
};
