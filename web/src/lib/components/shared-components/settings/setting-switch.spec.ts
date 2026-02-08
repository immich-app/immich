import { render } from '@testing-library/svelte';
import SettingSwitch from './setting-switch.svelte';

describe('SettingSwitch component', () => {
  it('links switch and subtitle ids on the switch', () => {
    const { getByText } = render(SettingSwitch, {
      props: {
        title: 'Enable feature',
        subtitle: 'Controls the feature state.',
      },
    });

    const label = getByText('Enable feature') as HTMLLabelElement;
    const subtitle = getByText('Controls the feature state.');
    const subtitleId = subtitle.getAttribute('id');
    const switchElement = document.querySelector(`#${label.htmlFor}`);

    expect(subtitleId).not.toBeNull();
    expect(label.htmlFor).not.toBe('');
    expect(switchElement).not.toBeNull();
    expect(switchElement?.getAttribute('aria-describedby')).toBe(subtitleId);
  });
});
