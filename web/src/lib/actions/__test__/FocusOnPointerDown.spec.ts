import { fireEvent, render, screen } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import FocusOnPointerDownTest from './FocusOnPointerDownTest.svelte';

describe('focusOnPointerDown action', () => {
  it('moves focus to the node on pointer down', async () => {
    render(FocusOnPointerDownTest);
    const target = screen.getByTestId('target');

    await fireEvent.pointerDown(target);

    expect(document.activeElement).toBe(target);
  });

  it('moves focus to the node on wheel', async () => {
    render(FocusOnPointerDownTest);
    const target = screen.getByTestId('target');

    await fireEvent.wheel(target);

    expect(document.activeElement).toBe(target);
  });

  it('moves focus to the node when a non-interactive child is pressed', async () => {
    render(FocusOnPointerDownTest);
    const target = screen.getByTestId('target');
    const span = screen.getByTestId('span');

    await fireEvent.pointerDown(span);

    expect(document.activeElement).toBe(target);
  });

  it('does not steal focus from interactive controls', async () => {
    render(FocusOnPointerDownTest);
    const target = screen.getByTestId('target');
    const button = screen.getByTestId('button');

    button.focus();
    await fireEvent.pointerDown(button);

    expect(document.activeElement).not.toBe(target);
    expect(document.activeElement).toBe(button);
  });
});
