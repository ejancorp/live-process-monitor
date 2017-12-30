// import pidusage from 'pidusage';
import http from 'http';
import socketio from 'socket.io';

/**
 * @class ProcessMonitor
 */
class ProcessMonitor {
  constructor() {
    this.server = http.createServer();
    this.io = socketio(this.server);
  }

  init() {
    this.io.on('connection', this._onConnect);
    this.server.listen(8181);
    console.log('Connection');
  }

  _onConnect(socket) {
    console.log(socket);
  }
}

const app = new ProcessMonitor();
app.init();

export default ProcessMonitor;
