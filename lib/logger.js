var log4js = require('log4js');
var morgan = require('morgan');
var fs = require('fs');
var path = require('path');
var fluentLogger = require('fluent-logger');

var logDir = path.join(__dirname, '..', 'log');

if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

log4js.configure({
  appenders: [
    { type: 'file', filename: path.join(logDir, 'app.log'),   category: 'app' },
    { type: 'file', filename: path.join(logDir, 'error.log'), category: 'error' }
  ]
});

log4js.addAppender(fluentLogger.support.log4jsAppender('debug', { host: 'localhost', port: 24224, timeout: 3.0 }));

var format = ':remote-addr - - [:date] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent"';
var stream = fs.createWriteStream(path.join(logDir, 'access.log'), { flags: 'a'});

var loggerApp    = log4js.getLogger('app');
var loggerError  = log4js.getLogger('error');

exports.accessLogger = function(req, res, next) {
  var start = new Date();
  morgan(format, { stream: stream })(req, res, function() {
    fluentLogger.emit('access', {
      'remote-address': req.ip,
      method:           req.method,
      url:              req.protocol + '://' + req.get('host') + req.url,
      'http-version':   req.httpVersion,
      status:           res.statusCode,
      referrer:         req.get('referrer') || '',
      'user-agent':     req.get('user-agent'),
      'response-time':  new Date() - start
    });
    next();
  });
};

exports.warn  = function(s) { loggerError.warn(s); };
exports.error = function(s) { loggerError.error(s); };
exports.fatal = function(s) { loggerError.fatal(s); };
exports.info  = function(s) { loggerApp.info(s); };
