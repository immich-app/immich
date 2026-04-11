import { render, waitFor } from '@testing-library/svelte';
import { SharedLinkType } from '@immich/sdk';
import { sharedLinkFactory } from '@test-data/factories/shared-link-factory';
import { afterEach, describe, expect, it } from 'vitest';

import { getSharedLink, setSharedLink } from '$lib/utils';

import SharedLinkPage from './SharedLinkPage.svelte';

describe('SharedLinkPage component', () => {
  afterEach(() => {
    setSharedLink(undefined);
  });

  it('initializes shared-link state for non-password shared links', async () => {
    const sharedLink = sharedLinkFactory.build({
      allowDownload: true,
      type: '__test__' as SharedLinkType,
    });

    render(SharedLinkPage, {
      data: {
        meta: { title: 'Shared link' },
        passwordRequired: false,
        sharedLink,
      },
    });

    await waitFor(() => {
      expect(getSharedLink()).toEqual(sharedLink);
    });
  });

  it('clears shared-link state on destroy', async () => {
    const sharedLink = sharedLinkFactory.build({
      allowDownload: true,
      type: '__test__' as SharedLinkType,
    });

    const view = render(SharedLinkPage, {
      data: {
        meta: { title: 'Shared link' },
        passwordRequired: false,
        sharedLink,
      },
    });

    await waitFor(() => {
      expect(getSharedLink()).toEqual(sharedLink);
    });

    view.unmount();

    expect(getSharedLink()).toBeUndefined();
  });
});