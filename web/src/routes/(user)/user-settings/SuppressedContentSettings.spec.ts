import { SuppressionScope, type AuthStatusResponseDto, type TagResponseDto } from '@immich/sdk';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/svelte';
import { getAnimateMock } from '$lib/__mocks__/animate.mock';
import { getIntersectionObserverMock } from '$lib/__mocks__/intersection-observer.mock';
import { sdkMock } from '$lib/__mocks__/sdk.mock';
import { getVisualViewportMock } from '$lib/__mocks__/visual-viewport.mock';
import { authManager } from '$lib/managers/auth-manager.svelte';
import { personFactory } from '@test-data/factories/person-factory';
import { preferencesFactory } from '@test-data/factories/preferences-factory';
import SuppressedContentSettings from './SuppressedContentSettings.svelte';

const appMocks = vi.hoisted(() => ({
  goto: vi.fn(),
  page: {
    params: {},
    route: { id: '/(user)/user-settings' },
    url: new URL('http://localhost/user-settings?isOpen=suppressed-content'),
  },
}));

vi.mock('$app/navigation', () => ({
  goto: appMocks.goto,
}));

vi.mock('$app/state', () => ({
  page: appMocks.page,
}));

vi.mock('@immich/ui', async () => {
  const { default: Button } = await import('@test-data/components/MockButton.svelte');
  const { default: Field } = await import('@test-data/components/MockField.svelte');
  const { default: Icon } = await import('@test-data/components/MockIcon.svelte');
  const { default: IconButton } = await import('@test-data/components/MockIconButton.svelte');
  const { default: Label } = await import('@test-data/components/MockLabel.svelte');
  const { default: Text } = await import('@test-data/components/MockText.svelte');

  return {
    Button,
    Field,
    Icon,
    IconButton,
    Label,
    Text,
    toastManager: {
      primary: vi.fn(),
    },
  };
});

vi.mock('$lib/utils', () => ({
  getPeopleThumbnailUrl: (person: { id: string }) => `/people/${person.id}/thumbnail`,
}));

describe('SuppressedContentSettings', () => {
  const tag = (overrides: Partial<TagResponseDto>): TagResponseDto => ({
    createdAt: '2024-01-01T00:00:00.000Z',
    id: 'tag-1',
    name: 'Medical',
    updatedAt: '2024-01-01T00:00:00.000Z',
    value: 'Medical',
    ...overrides,
  });

  const authStatus = (overrides: Partial<AuthStatusResponseDto> = {}): AuthStatusResponseDto => ({
    isElevated: true,
    password: false,
    pinCode: true,
    ...overrides,
  });

  const renderSettings = async () => {
    render(SuppressedContentSettings);
    await waitFor(() => expect(sdkMock.getAuthStatus).toHaveBeenCalled());
  };

  beforeEach(() => {
    vi.resetAllMocks();
    vi.stubGlobal('IntersectionObserver', getIntersectionObserverMock());
    vi.stubGlobal('visualViewport', getVisualViewportMock());
    Element.prototype.animate = getAnimateMock();
    authManager.setPreferences(preferencesFactory.build());
    sdkMock.getAuthStatus.mockResolvedValue(authStatus());
    sdkMock.getAllTags.mockResolvedValue([]);
    sdkMock.updateMyPreferences.mockResolvedValue(preferencesFactory.build());
  });

  afterEach(() => {
    authManager.reset();
  });

  it('keeps configured names hidden until the session is elevated', async () => {
    sdkMock.getAuthStatus.mockResolvedValue(authStatus({ isElevated: false }));

    await renderSettings();

    expect(await screen.findByText('suppressed_content_locked_title')).toBeInTheDocument();
    expect(sdkMock.getAllTags).not.toHaveBeenCalled();

    await fireEvent.click(screen.getByRole('button', { name: 'unlock' }));

    expect(appMocks.goto).toHaveBeenCalledWith(
      '/auth/pin-prompt?continue=%2Fuser-settings%3FisOpen%3Dsuppressed-content',
    );
  });

  it('adds and removes existing tags and persists the selected scope', async () => {
    const medicalTag = tag({ id: 'tag-medical', name: 'Medical', value: 'Medical' });
    const travelTag = tag({ id: 'tag-travel', name: 'Travel', value: 'Travel' });
    authManager.setPreferences(
      preferencesFactory.build({
        privacy: {
          suppression: {
            personIds: [],
            scope: SuppressionScope.Owned,
            tagIds: [medicalTag.id],
          },
        },
      }),
    );
    sdkMock.getAllTags.mockResolvedValue([medicalTag, travelTag]);

    await renderSettings();

    expect(await screen.findByText('Medical')).toBeInTheDocument();

    const tagInput = screen.getByRole('combobox', { name: 'tag' });
    await fireEvent.focus(tagInput);
    await fireEvent.input(tagInput, { target: { value: 'Travel' } });
    await fireEvent.click(await screen.findByRole('option', { name: 'Travel' }));

    const medicalPill = screen.getByText('Medical').closest('.group');
    expect(medicalPill).not.toBeNull();
    await fireEvent.click(within(medicalPill as HTMLElement).getByTitle('remove_tag'));
    await fireEvent.click(screen.getByRole('button', { name: 'all_visible_assets' }));
    await fireEvent.click(screen.getByRole('button', { name: 'save' }));

    await waitFor(() =>
      expect(sdkMock.updateMyPreferences).toHaveBeenCalledWith({
        userPreferencesUpdateDto: {
          privacy: {
            suppression: {
              personIds: [],
              scope: SuppressionScope.Visible,
              tagIds: [travelTag.id],
            },
          },
        },
      }),
    );
  });

  it('creates tags and manages people from autocomplete before saving', async () => {
    const newTag = tag({ id: 'tag-created', name: 'Medical', value: 'Medical' });
    const exPerson = personFactory.build({ id: 'person-ex', name: 'Former Partner', thumbnailPath: '/ex.jpg' });
    const alice = personFactory.build({ id: 'person-alice', name: 'Alice', thumbnailPath: '/alice.jpg' });
    authManager.setPreferences(
      preferencesFactory.build({
        privacy: {
          suppression: {
            personIds: [exPerson.id],
            scope: SuppressionScope.Owned,
            tagIds: [],
          },
        },
      }),
    );
    sdkMock.getPerson.mockResolvedValue(exPerson);
    sdkMock.searchPerson.mockResolvedValue([alice, exPerson]);
    sdkMock.upsertTags.mockResolvedValue([newTag]);

    await renderSettings();

    expect(await screen.findByTitle('Former Partner')).toBeInTheDocument();

    const tagInput = screen.getByRole('combobox', { name: 'tag' });
    await fireEvent.focus(tagInput);
    await fireEvent.input(tagInput, { target: { value: 'Medical' } });
    await fireEvent.click(await screen.findByRole('option', { name: 'Medical' }));

    await waitFor(() => expect(sdkMock.upsertTags).toHaveBeenCalledWith({ tagUpsertDto: { tags: ['Medical'] } }));

    const peopleInput = screen.getByPlaceholderText('search_people');
    await fireEvent.input(peopleInput, { target: { value: 'Ali' } });

    await waitFor(() =>
      expect(sdkMock.searchPerson).toHaveBeenCalledWith(
        { name: 'Ali', withHidden: true },
        { signal: expect.any(AbortSignal) },
      ),
    );
    await fireEvent.click(await screen.findByRole('button', { name: 'Alice' }));
    await fireEvent.click(screen.getAllByLabelText('remove_person')[0]);
    await fireEvent.click(screen.getByRole('button', { name: 'save' }));

    await waitFor(() =>
      expect(sdkMock.updateMyPreferences).toHaveBeenCalledWith({
        userPreferencesUpdateDto: {
          privacy: {
            suppression: {
              personIds: [alice.id],
              scope: SuppressionScope.Owned,
              tagIds: [newTag.id],
            },
          },
        },
      }),
    );
  });
});
