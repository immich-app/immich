const createObjectURLMock = jest.fn();

Object.defineProperty(URL, 'createObjectURL', {
  writable: true,
  value: createObjectURLMock,
});

export { createObjectURLMock };
