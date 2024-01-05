const createObjectURLMock = vi.fn();

Object.defineProperty(URL, 'createObjectURL', {
  writable: true,
  value: createObjectURLMock,
});

export { createObjectURLMock };
