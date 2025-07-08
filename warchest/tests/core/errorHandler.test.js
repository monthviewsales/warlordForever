const errorHandler = require('../../src/core/errorHandler');
const chalk = require('chalk');

describe('core errorHandler', () => {
  test('logs error and exits', () => {
    const err = new Error('Test error');
    jest.spyOn(console, 'error').mockImplementation();
    jest.spyOn(process, 'exit').mockImplementation();
    errorHandler(err);
    expect(console.error).toHaveBeenCalled();
    expect(process.exit).toHaveBeenCalledWith(1);
  });
});