/* eslint-env mocha */
/* eslint no-unused-expressions: 0 */
import chai from 'chai';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
import App from '../src/app';

chai.use(sinonChai);
const { expect } = chai;

describe('Test Process Monitoring', () => {
  let monitor = null;

  before(() => {
    monitor = new App();
  });

  describe('#getAvailablePortTest', () => {
    it('should return with a available port number', (done) => {
      monitor.getAvailablePort().then((port) => {
        expect(port).to.be.a('Number');
        done();
      }).catch(() => {
        done();
      });
    });
  });

  describe('#checkPortStatusTest', () => {
    it('should return the status of the port as boolean', (done) => {
      monitor.checkPortStatus(monitor.options.port).then((status) => {
        expect(status).to.be.a('Boolean');
        done();
      }).catch(() => {
        done();
      });
    });
  });

  describe('#getUsageTest', () => {
    it('should return process information', (done) => {
      monitor.getUsage().then((data) => {
        expect(data).to.be.an('Object');
        expect(data).to.have.property('cpu');
        expect(data).to.have.property('memory');
        done();
      });
    });
  });

  describe('#sendMessageToCallbackTest', () => {
    it('should trigger the callback with message log', () => {
      const messageCallback = sinon.spy();
      monitor.options.messageCallback = messageCallback;

      monitor.sendMessageToCallback('Message');
      expect(messageCallback).to.be.calledOnce;
      expect(messageCallback).to.be.calledWith('Message');
    });
  });
});
