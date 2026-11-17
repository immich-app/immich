import FocusTrapTest from '#lib/actions/__test__/FocusTrapTest.svelte';
import { setDefaultTabbleOptions } from '#lib/utils/focus-util.ts';
import { tick } from 'svelte';
import { expect } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { userEvent } from 'vitest/browser';

setDefaultTabbleOptions({ displayCheck: 'none' });

describe('focusTrap action', () => {
  it('sets focus to the first focusable element', async () => {
    const screen = await render(FocusTrapTest, { show: true });
    await tick();
    expect(document.activeElement).toEqual(screen.getByTestId('one').element());
  });

  it('should not set focus if inactive', async () => {
    await render(FocusTrapTest, { show: true, active: false });
    await tick();
    expect(document.activeElement).toBe(document.body);
  });

  it('supports backward focus wrapping', async () => {
    const screen = await render(FocusTrapTest, { show: true });
    await tick();
    await userEvent.keyboard('{Shift>}{Tab}{/Shift}');
    expect(document.activeElement).toEqual(screen.getByTestId('three').element());
  });

  it('supports forward focus wrapping', async () => {
    const screen = await render(FocusTrapTest, { show: true });
    await tick();
    (screen.getByTestId('three').element() as HTMLElement).focus();
    await userEvent.keyboard('{Tab}');
    expect(document.activeElement).toEqual(screen.getByTestId('one').element());
  });

  it('restores focus to the triggering element', async () => {
    const screen = await render(FocusTrapTest, { show: false });
    const openButton = screen.getByText('Open');

    await openButton.click();
    await tick();
    expect(document.activeElement).toEqual(screen.getByTestId('one').element());

    await screen.getByText('Close').click();
    await tick();
    expect(document.activeElement).toEqual(openButton.element());
  });
});
