import FocusTrapTest from '$lib/actions/__test__/focus-trap-test.svelte';
import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { tick } from 'svelte';

describe('focusTrap action', () => {
  const user = userEvent.setup();

  it('sets focus to the first focusable element', () => {
    render(FocusTrapTest, { show: true });
    expect(document.activeElement).toEqual(screen.getByTestId('one'));
  });

  it('supports backward focus wrapping', async () => {
    render(FocusTrapTest, { show: true });
    await user.keyboard('{Shift>}{Tab}{/Shift}');
    expect(document.activeElement).toEqual(screen.getByTestId('three'));
  });

  it('supports forward focus wrapping', async () => {
    render(FocusTrapTest, { show: true });
    screen.getByTestId('three').focus();
    await user.keyboard('{Tab}');
    expect(document.activeElement).toEqual(screen.getByTestId('one'));
  });

  it('restores focus to the triggering element', async () => {
    render(FocusTrapTest, { show: false });
    const openButton = screen.getByText('Open');

    openButton.focus();
    openButton.click();
    await tick();
    expect(document.activeElement).toEqual(screen.getByTestId('one'));

    screen.getByText('Close').click();
    await tick();
    expect(document.activeElement).toEqual(openButton);
  });
});
