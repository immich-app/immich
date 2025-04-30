import FocusTrapTest from '$lib/actions/__test__/focus-trap-test.svelte';
import { setDefaultTabbleOptions } from '$lib/utils/focus-util';
import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { tick } from 'svelte';

setDefaultTabbleOptions({ displayCheck: 'none' });

describe('focusTrap action', () => {
  const user = userEvent.setup();

  it('sets focus to the first focusable element', async () => {
    render(FocusTrapTest, { show: true });
    await tick();
    expect(document.activeElement).toEqual(screen.getByTestId('one'));
  });

  it('should not set focus if inactive', async () => {
    render(FocusTrapTest, { show: true, active: false });
    await tick();
    expect(document.activeElement).toBe(document.body);
  });

  it('supports backward focus wrapping', async () => {
    render(FocusTrapTest, { show: true });
    await tick();
    await user.keyboard('{Shift>}{Tab}{/Shift}');
    expect(document.activeElement).toEqual(screen.getByTestId('three'));
  });

  it('supports forward focus wrapping', async () => {
    render(FocusTrapTest, { show: true });
    await tick();
    screen.getByTestId('three').focus();
    await user.keyboard('{Tab}');
    expect(document.activeElement).toEqual(screen.getByTestId('one'));
  });

  it('restores focus to the triggering element', async () => {
    render(FocusTrapTest, { show: false });
    const openButton = screen.getByText('Open');

    await user.click(openButton);
    await tick();
    expect(document.activeElement).toEqual(screen.getByTestId('one'));

    screen.getByText('Close').click();
    await tick();
    expect(document.activeElement).toEqual(openButton);
  });
});
