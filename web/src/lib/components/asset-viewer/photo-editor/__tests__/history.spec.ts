/* eslint-disable unicorn/no-array-push-push */
import { createHistory } from '$lib/components/asset-viewer/photo-editor/history';

describe('Editor history', () => {
  it('reports undo is unavailable when history is empty', () => {
    const h = createHistory();

    expect(h.canUndo()).toBe(false);
  });

  it('reports redo is unavailable when history is empty', () => {
    const h = createHistory();

    expect(h.canRedo()).toBe(false);
  });

  it('cannot undo after only one change', () => {
    const h = createHistory();

    h.push({ type: 'foo', properties: {} });
    expect(h.canUndo()).toBe(false);
  });

  it('can undo after more than one change', () => {
    const h = createHistory();

    h.push({ type: 'foo', properties: {} });
    h.push({ type: 'foo', properties: {} });
    expect(h.canUndo()).toBe(true);
  });

  it('cannot redo if undo has not been called', () => {
    const h = createHistory();

    h.push({ type: 'foo', properties: {} });
    expect(h.canRedo()).toBe(false);
  });

  it('can redo after undo', () => {
    const h = createHistory();

    h.push({ type: 'foo', properties: {} });
    h.push({ type: 'foo', properties: {} });
    h.undo();
    expect(h.canRedo()).toBe(true);
  });

  it('returns the current state based on resolving the change history', () => {
    const h = createHistory();

    h.push({ type: 'foo', properties: { a: 1, b: 2 } });
    h.push({ type: 'foo', properties: { a: 2 } });
    expect(h.currentState()).toEqual({
      foo: { a: 2 },
    });
  });

  it('returns the current state based on resolving the change history after undo', () => {
    const h = createHistory();

    h.push({ type: 'foo', properties: { a: 1, b: 2 } });
    h.push({ type: 'foo', properties: { a: 2 } });
    expect(h.undo()).toEqual({
      foo: { a: 1, b: 2 },
    });
  });

  it('cannot redo after pushing a new change after undo', () => {
    const h = createHistory();

    h.push({ type: 'foo', properties: { a: 1, b: 2 } });
    h.push({ type: 'foo', properties: { a: 2 } });
    h.undo();
    h.push({ type: 'foo', properties: { a: 3 } });
    expect(h.canRedo()).toBe(false);
  });

  it('removes all undone changes when a new change is pushed', () => {
    const h = createHistory();

    h.push({ type: 'foo', properties: { a: 1, b: 2 } });
    h.push({ type: 'foo', properties: { a: 2 } });
    h.undo();
    h.push({ type: 'bar', properties: { a: 3 } });
    expect(h.currentState()).toEqual({
      foo: { a: 1, b: 2 },
      bar: { a: 3 },
    });
  });
});
