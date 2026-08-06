import { describe, expect, it } from 'vitest';
import { isInteractiveElement } from './focus-util';

describe('isInteractiveElement', () => {
  const createElement = (tag: string, attrs: Record<string, string> = {}) => {
    const element = document.createElement(tag);
    for (const [key, value] of Object.entries(attrs)) {
      element.setAttribute(key, value);
    }
    return element;
  };

  it('returns true for interactive controls', () => {
    const cases = [
      ['button', {}],
      ['input', {}],
      ['textarea', {}],
      ['select', {}],
      ['summary', {}],
      ['video', {}],
      ['audio', {}],
      ['a', { href: '#' }],
      ['div', { contenteditable: 'true' }],
      ['div', { role: 'button' }],
      ['div', { 'data-overlay-interactive': '' }],
    ] as const;

    for (const [tag, attrs] of cases) {
      expect(isInteractiveElement(createElement(tag, attrs)), tag).toBe(true);
    }
  });

  it('returns true for descendants of interactive controls', () => {
    const button = document.createElement('button');
    const span = document.createElement('span');
    button.append(span);

    expect(isInteractiveElement(span)).toBe(true);
  });

  it('returns false for non-interactive elements', () => {
    const cases = [
      ['div', {}],
      ['img', {}],
      ['span', {}],
      ['section', {}],
      ['a', {}],
      ['canvas', { class: 'maplibregl-canvas', tabindex: '0' }],
    ] as const;

    for (const [tag, attrs] of cases) {
      expect(isInteractiveElement(createElement(tag, attrs)), tag).toBe(false);
    }
  });

  it('returns false for null and non-element targets', () => {
    expect(isInteractiveElement(null)).toBe(false);
    expect(isInteractiveElement(new EventTarget())).toBe(false);
  });
});
