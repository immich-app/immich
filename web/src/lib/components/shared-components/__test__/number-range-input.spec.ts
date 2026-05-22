import NumberRangeInput from '$lib/components/shared-components/number-range-input.svelte';
import { render, type RenderResult } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import type { Mock } from 'vitest';

describe('NumberRangeInput component', () => {
  const user = userEvent.setup();
  let sut: RenderResult<NumberRangeInput>;
  let input: HTMLInputElement;
  let onInput: Mock;
  let onKeyDown: Mock;

  beforeEach(() => {
    onInput = vi.fn();
    onKeyDown = vi.fn();
    sut = render(NumberRangeInput, {
      id: '',
      min: -90,
      max: 90,
      onInput,
      onKeyDown,
    });
    input = sut.getByRole('spinbutton') as HTMLInputElement;
  });

  it('updates value', async () => {
    expect(input.value).toBe('');
    await sut.rerender({ value: 10 });
    expect(input.value).toBe('10');
    expect(onInput).not.toHaveBeenCalled();
    expect(onKeyDown).not.toHaveBeenCalled();
  });

  it('restricts minimum value', async () => {
    await user.type(input, '-91');
    expect(input.value).toBe('-90');
    expect(onInput).toHaveBeenCalled();
    expect(onKeyDown).toHaveBeenCalled();
  });

  it('restricts maximum value', async () => {
    await user.type(input, '09990');
    expect(input.value).toBe('90');
    expect(onInput).toHaveBeenCalled();
    expect(onKeyDown).toHaveBeenCalled();
  });

  it('allows entering negative numbers', async () => {
    await user.type(input, '-10');
    expect(input.value).toBe('-10');
    expect(onInput).toHaveBeenCalled();
    expect(onKeyDown).toHaveBeenCalled();
  });

  it('allows entering zero', async () => {
    await user.type(input, '0');
    expect(input.value).toBe('0');
    expect(onInput).toHaveBeenCalled();
    expect(onKeyDown).toHaveBeenCalled();
  });

  it('allows entering decimal numbers', async () => {
    await user.type(input, '-0.09001');
    expect(input.value).toBe('-0.09001');
    expect(onInput).toHaveBeenCalled();
    expect(onKeyDown).toHaveBeenCalled();
  });

  it('ignores text input', async () => {
    await user.type(input, 'test');
    expect(input.value).toBe('');
    expect(onInput).toHaveBeenCalled();
    expect(onKeyDown).toHaveBeenCalled();
  });

  it('test', async () => {
    await user.type(input, 'd');
    expect(onInput).not.toHaveBeenCalled();
    expect(onKeyDown).toHaveBeenCalled();
  });
});
