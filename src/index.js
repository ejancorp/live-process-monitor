/**
 * Created by ej on 3/15/17.
 */
const server = require('http').createServer();
const io = require('socket.io')(server);

io.on('connection', (socket) => {
  console.log(socket);
});
server.listen(8181);
