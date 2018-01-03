const Monitor = require('../dist/app');

const app = new Monitor.default({
  messageCallback: (message) => {
    /* eslint no-console: 0 */
    console.log(message);
  },
});
app.init();
