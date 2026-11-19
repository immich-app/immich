import { Draft } from '#lib/utils/draft.svelte.ts';

describe('Draft', () => {
  it('shows the source while nothing is typed', () => {
    let source = $state('server');
    const sut = new Draft(() => source);

    source = 'changed elsewhere';

    expect(sut.value).toBe('changed elsewhere');
  });

  it('keeps typed text when the source changes', () => {
    let source = $state('server');
    const sut = new Draft(() => source);
    sut.value = 'typed';

    source = 'changed elsewhere';

    expect(sut.value).toBe('typed');
  });

  it('keeps typed text that matches the source', () => {
    let source = $state('server');
    const sut = new Draft(() => source);
    sut.value = 'server';

    source = 'changed elsewhere';

    expect(sut.value).toBe('server');
  });

  it('shows the source again after a reset', () => {
    let source = $state('server');
    const sut = new Draft(() => source);
    sut.value = 'typed';

    sut.reset();
    source = 'changed elsewhere';

    expect(sut.value).toBe('changed elsewhere');
  });
});
