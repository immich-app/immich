export const newFSWatcherMock = () => {
  return {
    options: {},
    on: jest.fn(),
    add: jest.fn(),
    unwatch: jest.fn(),
    getWatched: jest.fn(),
    close: jest.fn(),
    addListener: jest.fn(),
    removeListener: jest.fn(),
    removeAllListeners: jest.fn(),
    eventNames: jest.fn(),
    rawListeners: jest.fn(),
    listeners: jest.fn(),
    emit: jest.fn(),
    listenerCount: jest.fn(),
    off: jest.fn(),
    once: jest.fn(),
    prependListener: jest.fn(),
    prependOnceListener: jest.fn(),
    setMaxListeners: jest.fn(),
    getMaxListeners: jest.fn(),
  };
};
