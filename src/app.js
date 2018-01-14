import http from 'http';
import pidusage from 'pidusage';
import socketio from 'socket.io';
import portused from 'tcp-port-used';
import promiseRetry from 'promise-retry';

/**
 * @class ProcessMonitor
 */
class ProcessMonitor {
  constructor(options = {
    port: 8181,
    checkInterval: 5000,
    messageCallback: null,
  }, customData = {}) {
    this.options = Object.assign({
      port: 8181,
      checkInterval: 5000,
      messageCallback: null,
    }, options);
    this.customData = customData;
    this.server = http.createServer();
    this.io = socketio(this.server);
    this.polling = null;
  }

  /**
   * Setup sockets
   * @return {Void}
   */
  init() {
    this.io.on('connection', this._onConnect.bind(this));
    this.getAvailablePort(this.options.port).then(this._onPortAvailable.bind(this));
    this.polling = this.setUsagePolling(this.emitUsage.bind(this));
  }

  /**
   * Callback when an open port is found
   * @param  {Integer} port port number
   * @return {Void}
   */
  _onPortAvailable(port) {
    this.options.port = port;
    this.server.listen(this.options.port, () => {
      this.sendMessageToCallback(`Monitoring started on port: ${this.options.port}`);
    });
  }

  /**
   * Get available port
   * @return {Promise} [description]
   */
  getAvailablePort() {
    return new Promise((resolve, reject) => {
      promiseRetry(retry => this.checkPortStatus(this.options.port)
        .catch((err) => {
          this.options.port += 1;

          return retry(err);
        }))
        .then(value => resolve(value), err => reject(err));
    });
  }

  /**
   * Check port status, open or used already
   * @param  {Integer} targetPort
   * @return {Promise}
   */
  checkPortStatus(targetPort) {
    return new Promise((resolve, reject) => {
      this.sendMessageToCallback(`Trying Port ${targetPort}`);
      portused.check(targetPort)
        .then((status) => {
          if (status) {
            return reject(new Error(`Port ${targetPort} is being used.`));
          }

          return resolve(targetPort);
        })
        .catch(error => reject(error));
    });
  }

  /**
   * Set custom object data
   * @param {Object} [data={}] Set a custom data to be passed on the stats
   */
  setCustomData(data = {}) {
    this.customData = data;
  }

  /**
   * [sendMessageToCallback description]
   * @param  {String} [message=''] [description]
   * @return {[type]}              [description]
   */
  sendMessageToCallback(message = '') {
    if (typeof this.options.messageCallback !== 'function') {
      return false;
    }

    return this.options.messageCallback.call(null, message);
  }

  /**
   * [_onConnect description]
   * @return {[type]} [description]
   */
  _onConnect() {
    // On success client connection callback
  }

  /**
   * [emitUsage description]
   * @return {[type]} [description]
   */
  emitUsage() {
    return this.getUsage().then((usage) => {
      this.io.emit('status', Object.assign(this.customData, usage));
    });
  }

  setUsagePolling(method) {
    return setTimeout(() => {
      method.call().then(() => this.setUsagePolling(method));
    }, this.options.checkInterval);
  }

  /**
   * [getUsage description]
   * @return {[type]} [description]
   */
  getUsage() {
    return new Promise((resolve, reject) => {
      pidusage.stat(process.pid, { advanced: true }, (err, stat) => {
        if (err) {
          return reject(err);
        }

        return resolve(stat);
      });
    });
  }
}

if (require.main === module) {
  const app = new ProcessMonitor({
    messageCallback: (message) => {
      /* eslint no-console: 0 */
      console.log(message);
    },
  });
  app.init();
}

export default ProcessMonitor;
