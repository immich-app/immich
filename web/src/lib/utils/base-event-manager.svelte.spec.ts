import { BaseEventManager } from '#lib/utils/base-event-manager.svelte.ts';

type Events = { changed: [value: string] };

describe('BaseEventManager', () => {
  it('keeps earlier subscriptions when another one is added', () => {
    const manager = new BaseEventManager<Events>();
    const first = vi.fn();
    const second = vi.fn();

    manager.on({ changed: first });
    manager.on({ changed: second });
    manager.emit('changed', 'a');

    expect(first).toHaveBeenCalledWith('a');
    expect(second).toHaveBeenCalledWith('a');
  });

  it('only removes the subscription that was cleaned up', () => {
    const manager = new BaseEventManager<Events>();
    const first = vi.fn();
    const second = vi.fn();
    manager.on({ changed: first });
    const cleanup = manager.on({ changed: second });

    cleanup();
    manager.emit('changed', 'b');

    expect(first).toHaveBeenCalledWith('b');
    expect(second).not.toHaveBeenCalled();
    expect(manager.hasListeners('changed')).toBe(true);
  });
});
