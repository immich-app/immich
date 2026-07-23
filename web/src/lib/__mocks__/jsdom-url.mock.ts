const createObjectURLMock = vi.fn();

// eslint-disable-next-line unicorn/no-top-level-side-effects
Object.defineProperty(URL, 'createObjectURL', {
  writable: true,
  value: createObjectURLMock,
});

export { createObjectURLMock };
