import { Theme } from '$lib/constants';
import { themeManager } from '$lib/managers/theme-manager.svelte';
import { beforeEach, describe, expect, it } from 'vitest';
import { forceDarkTheme } from '../force-dark-theme';

describe('forceDarkTheme Action', () => {
  beforeEach(() => {
    document.body.className = '';
  });

  it('adds dark class on render, and removes it on destroy when light theme in use', () => {
    themeManager.setTheme(Theme.LIGHT);

    expect(document.body.classList.contains('dark')).toBe(false);

    const node = document.createElement('div');
    const action = forceDarkTheme(node);

    expect(document.body.classList.contains('dark')).toBe(true);

    action?.destroy?.();
    expect(document.body.classList.contains('dark')).toBe(false);
  });

  it('does not remove dark class on destroy when dark theme in use', () => {
    themeManager.setTheme(Theme.DARK);

    expect(document.body.classList.contains('dark')).toBe(true);

    const node = document.createElement('div');
    const action = forceDarkTheme(node);

    expect(document.body.classList.contains('dark')).toBe(true);

    action?.destroy?.();
    expect(document.body.classList.contains('dark')).toBe(true);
  });
});
