export const getVisualViewportMock = () => ({
  height: window.innerHeight,
  width: window.innerWidth,
  scale: 1,
  offsetLeft: 0,
  offsetTop: 0,
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
});
