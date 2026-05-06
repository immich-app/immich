import { sdkMock } from '$lib/__mocks__/sdk.mock';
import { Type, type PersonResponseDto } from '@immich/sdk';
import '@testing-library/jest-dom';
import { render, screen, waitFor } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { afterEach } from 'vitest';
import PersonMergeSuggestionModal from './PersonMergeSuggestionModal.svelte';

vi.mock('../components/assets/thumbnail/image-thumbnail.svelte', async () => {
  const { default: MockComponent } = await import('@test-data/mocks/image-thumbnail.stub.svelte');
  return { default: MockComponent };
});

vi.mock('@immich/ui', async (importOriginal) => {
  const original = await importOriginal<typeof import('@immich/ui')>();
  return {
    ...original,
    toastManager: { primary: vi.fn() },
  };
});

// Drain bits-ui Modal's deferred body-scroll-lock cleanup before happy-dom tears
// down `document`. Otherwise CI can report an unhandled `document is not defined`
// after all assertions in this file have passed.
afterEach(async () => {
  await new Promise((resolve) => setTimeout(resolve, 500));
});

function person(overrides: Partial<PersonResponseDto> = {}): PersonResponseDto {
  return {
    id: 'person-1',
    name: 'Person',
    birthDate: null,
    thumbnailPath: '',
    isHidden: false,
    isFavorite: false,
    color: undefined,
    type: 'person',
    species: null,
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('PersonMergeSuggestionModal', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('uses scoped identity repair when either side is a space primary profile', async () => {
    render(PersonMergeSuggestionModal, {
      personToMerge: person({
        id: 'space-visible-person',
        primaryProfile: { type: Type.SpacePerson, id: 'space-person-1', spaceId: 'space-1' },
      }),
      personToBeMergedInto: person({ id: 'person-target' }),
      potentialMergePeople: [],
      onClose: vi.fn(),
    });

    await userEvent.click(screen.getByRole('button', { name: 'yes' }));

    await waitFor(() =>
      expect(sdkMock.mergeScopedPeople).toHaveBeenCalledWith({
        mergeScopedPeopleDto: {
          target: { type: 'person', id: 'person-target' },
          sources: [{ type: 'space-person', id: 'space-person-1', spaceId: 'space-1' }],
        },
      }),
    );
    expect(sdkMock.mergePerson).not.toHaveBeenCalled();
  });

  it('keeps legacy personal merge when both sides are personal profiles', async () => {
    render(PersonMergeSuggestionModal, {
      personToMerge: person({ id: 'person-source' }),
      personToBeMergedInto: person({ id: 'person-target' }),
      potentialMergePeople: [],
      onClose: vi.fn(),
    });

    await userEvent.click(screen.getByRole('button', { name: 'yes' }));

    await waitFor(() =>
      expect(sdkMock.mergePerson).toHaveBeenCalledWith({
        id: 'person-target',
        mergePersonDto: { ids: ['person-source'] },
      }),
    );
    expect(sdkMock.mergeScopedPeople).not.toHaveBeenCalled();
  });
});
