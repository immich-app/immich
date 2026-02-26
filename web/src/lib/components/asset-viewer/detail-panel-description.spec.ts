import { assetFactory } from '@test-data/factories/asset-factory';
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import DetailPanelDescription from './detail-panel-description.svelte';

describe('DetailPanelDescription', () => {
  it('clears unsaved draft on asset change', async () => {
    const user = userEvent.setup();

    const assetA = assetFactory.build({
      id: 'asset-a',
      exifInfo: { description: '' },
    });
    const assetB = assetFactory.build({
      id: 'asset-b',
      exifInfo: { description: '' },
    });

    const { rerender } = render(DetailPanelDescription, {
      props: {
        asset: assetA,
        isOwner: true,
      },
    });

    const textarea = screen.getByTestId('autogrow-textarea') as HTMLTextAreaElement;
    await user.type(textarea, 'unsaved draft');
    expect(textarea).toHaveValue('unsaved draft');

    await rerender({
      asset: assetB,
      isOwner: true,
    });

    expect(screen.getByTestId('autogrow-textarea')).toHaveValue('');
  });

  it('updates description on asset switch', async () => {
    const assetA = assetFactory.build({
      id: 'asset-a',
      exifInfo: { description: 'first description' },
    });
    const assetB = assetFactory.build({
      id: 'asset-b',
      exifInfo: { description: 'second description' },
    });

    const { rerender } = render(DetailPanelDescription, {
      props: {
        asset: assetA,
        isOwner: true,
      },
    });

    expect(screen.getByTestId('autogrow-textarea')).toHaveValue('first description');

    await rerender({
      asset: assetB,
      isOwner: true,
    });

    expect(screen.getByTestId('autogrow-textarea')).toHaveValue('second description');
  });
});
