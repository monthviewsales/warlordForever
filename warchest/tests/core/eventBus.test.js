const EventEmitter = require('events');
const eventBus = require('../../src/core/eventBus');

describe('core eventBus', () => {
  test('eventBus is instance of EventEmitter', () => {
    expect(eventBus).toBeInstanceOf(EventEmitter);
  });
});