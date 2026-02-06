import { render } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import SharedLinkFormFields from './SharedLinkFormFields.svelte';

describe('SharedLinkFormFields component', () => {
  const isChecked = (element: Element) =>
    element instanceof HTMLInputElement ? element.checked : element.getAttribute('aria-checked') === 'true';

  it('turns downloads off when metadata is disabled', async () => {
    const { container } = render(SharedLinkFormFields, {
      props: {
        slug: '',
        password: '',
        description: '',
        allowDownload: true,
        allowUpload: false,
        showMetadata: true,
        expiresAt: null,
      },
    });
    const user = userEvent.setup();

    const switches = Array.from(container.querySelectorAll('[role="switch"], input[type="checkbox"]'));
    expect(switches).toHaveLength(3);

    const [showMetadataSwitch, allowDownloadSwitch] = switches;
    expect(isChecked(allowDownloadSwitch)).toBe(true);

    await user.click(showMetadataSwitch);

    expect(isChecked(showMetadataSwitch)).toBe(false);
    expect(isChecked(allowDownloadSwitch)).toBe(false);
  });
});
