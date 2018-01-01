'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _http = require('http');

var _http2 = _interopRequireDefault(_http);

var _pidusage = require('pidusage');

var _pidusage2 = _interopRequireDefault(_pidusage);

var _socket = require('socket.io');

var _socket2 = _interopRequireDefault(_socket);

var _tcpPortUsed = require('tcp-port-used');

var _tcpPortUsed2 = _interopRequireDefault(_tcpPortUsed);

var _promiseRetry = require('promise-retry');

var _promiseRetry2 = _interopRequireDefault(_promiseRetry);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var ProcessMonitor = function () {
  function ProcessMonitor() {
    var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {
      port: 8181,
      checkInterval: 5000,
      messageCallback: null
    };
    var customData = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

    _classCallCheck(this, ProcessMonitor);

    this.options = options;
    this.customData = customData;
    this.server = _http2.default.createServer();
    this.io = (0, _socket2.default)(this.server);
    this.polling = null;
  }

  _createClass(ProcessMonitor, [{
    key: 'init',
    value: function init() {
      this.io.on('connection', this._onConnect.bind(this));
      this.getAvailablePort(this.options.port).then(this._onPortAvailable.bind(this));
      this.polling = this.setUsagePolling(this.emitUsage.bind(this));
    }
  }, {
    key: '_onPortAvailable',
    value: function _onPortAvailable(port) {
      this.options.port = port;
      this.server.listen(this.options.port);
    }
  }, {
    key: 'getAvailablePort',
    value: function getAvailablePort() {
      var _this = this;

      return new Promise(function (resolve, reject) {
        (0, _promiseRetry2.default)(function (retry) {
          return _this.checkPortStatus(_this.options.port).catch(function (err) {
            _this.options.port += 1;

            return retry(err);
          });
        }).then(function (value) {
          return resolve(value);
        }, function (err) {
          return reject(err);
        });
      });
    }
  }, {
    key: 'checkPortStatus',
    value: function checkPortStatus(targetPort) {
      var _this2 = this;

      return new Promise(function (resolve, reject) {
        _this2.sendMessageToCallback('Trying Port ' + targetPort);
        _tcpPortUsed2.default.check(targetPort).then(function (status) {
          if (status) {
            return reject(new Error('Port ' + targetPort + ' is being used.'));
          }

          return resolve(targetPort);
        }).catch(function (error) {
          return reject(error);
        });
      });
    }
  }, {
    key: 'setCustomData',
    value: function setCustomData() {
      var data = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

      this.customData = data;
    }
  }, {
    key: 'sendMessageToCallback',
    value: function sendMessageToCallback() {
      var message = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '';

      if (typeof this.options.messageCallback !== 'function') {
        return false;
      }

      return this.options.messageCallback.call(null, message);
    }
  }, {
    key: '_onConnect',
    value: function _onConnect() {
      this.sendMessageToCallback('Monitoring started on port: ' + this.options.port);
    }
  }, {
    key: 'emitUsage',
    value: function emitUsage() {
      var _this3 = this;

      return this.getUsage().then(function (usage) {
        _this3.io.emit(Object.assign(_this3.customData, usage));
      });
    }
  }, {
    key: 'setUsagePolling',
    value: function setUsagePolling(method) {
      var _this4 = this;

      return setTimeout(function () {
        method.call().then(function () {
          return _this4.setUsagePolling(method);
        });
      }, this.options.checkInterval);
    }
  }, {
    key: 'getUsage',
    value: function getUsage() {
      return new Promise(function (resolve, reject) {
        _pidusage2.default.stat(process.pid, { advanced: true }, function (err, stat) {
          if (err) {
            return reject(err);
          }

          return resolve(stat);
        });
      });
    }
  }]);

  return ProcessMonitor;
}();

exports.default = ProcessMonitor;