import { SettingInputFieldType } from '$lib/constants';
import { render } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import SettingInputField from './setting-input-field.svelte';

describe('SettingInputField component', () => {
  it('validates number input on blur', async () => {
    const { getByRole } = render(SettingInputField, {
      props: {
        label: 'test-number-input',
        inputType: SettingInputFieldType.NUMBER,
        value: 0,
        min: 0,
        max: 100,
        step: '0.1',
      },
    });
    const user = userEvent.setup();

    const numberInput = getByRole('spinbutton') as HTMLInputElement;
    expect(numberInput.value).toEqual('0');

    await user.click(numberInput);
    await user.keyboard('100.1');
    expect(numberInput.value).toEqual('100.1');

    await user.click(document.body);
    expect(numberInput.value).toEqual('100');
  });

  it('allows emptying number inputs while editing', async () => {
    const { getByRole } = render(SettingInputField, {
      props: {
        label: 'test-number-input',
        inputType: SettingInputFieldType.NUMBER,
        value: 5,
      },
    });
    const user = userEvent.setup();

    const numberInput = getByRole('spinbutton') as HTMLInputElement;
    expect(numberInput.value).toEqual('5');

    await user.click(numberInput);
    await user.keyboard('{Backspace}');
    expect(numberInput.value).toEqual('');

    await user.click(document.body);
    expect(numberInput.value).toEqual('0');
  });
});
