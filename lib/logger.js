var log4js = require('log4js');
var morgan = require('morgan');
var fs = require('fs');
var path = require('path');
var fluentLogger = require('fluent-logger');

var logDir = path.join(__dirname, '..', 'log');

if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

var fluentTag = 'express';
var fluentOption = { host: 'localhost', port: 24224, timeout: 3.0 };
var accessLogFormat = ':remote-addr - - [:date] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent"';
var accessLogStream = fs.createWriteStream(path.join(logDir, 'access.log'), { flags: 'a'});

log4js.configure({
  appenders: [
    { type: 'file', filename: path.join(logDir, 'app.log'),   category: 'app' },
    { type: 'file', filename: path.join(logDir, 'error.log'), category: 'error' }
  ]
});
fluentLogger.configure(fluentTag, fluentOption);
log4js.addAppender(fluentLogger.support.log4jsAppender(fluentTag, fluentOption));

var loggerApp    = log4js.getLogger('app');
var loggerError  = log4js.getLogger('error');

exports.accessLogger = function(req, res, next) {
  morgan(accessLogFormat, { stream: accessLogStream })(req, res, function() {
    fluentLogger.emit('access', {
      'remote-address': req.ip,
      method:           req.method,
      url:              req.protocol + '://' + req.get('host') + req.url,
      'http-version':   req.httpVersion,
      status:           res.statusCode,
      referrer:         req.get('referrer') || '',
      'user-agent':     req.get('user-agent')
    });
    next();
  });
};

exports.warn  = function(s) { loggerError.warn(s); };
exports.error = function(s) { loggerError.error(s); };
exports.fatal = function(s) { loggerError.fatal(s); };
exports.info  = function(s) { loggerApp.info(s); };
