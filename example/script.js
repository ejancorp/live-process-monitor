import Monitor from '../src/app';

const app = new Monitor({
  messageCallback: (message) => {
    /* eslint no-console: 0 */
    console.log(message);
  },
});
app.init();
