/**
 * @module core/eventBus
 * @see README.md#events
 */

const EventEmitter = require('events');
const eventBus = new EventEmitter();

module.exports = eventBus;