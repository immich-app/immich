import {
  getAllTags,
  getAllTagsForAssets,
  upsertTags,
  type TagResponseDto,
  type TagsForAssetsResponseDto,
} from '@immich/sdk';
import { fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import { afterAll, beforeEach, describe, expect, test, vi } from 'vitest';
import { getAnimateMock } from '$lib/__mocks__/animate.mock';
import { getIntersectionObserverMock } from '$lib/__mocks__/intersection-observer.mock';
import { getVisualViewportMock } from '$lib/__mocks__/visual-viewport.mock';
import { tagUntagAssets } from '$lib/utils/asset-utils';
import AssetTagModal from './AssetTagModal.svelte';

vi.mock('@immich/sdk', () => {
  return {
    getAllTags: vi.fn(),
    getAllTagsForAssets: vi.fn(),
    upsertTags: vi.fn(),
  };
});
vi.mock('$lib/utils/asset-utils', () => {
  return {
    tagUntagAssets: vi.fn(),
  };
});
const mockTagUntagAssets = vi.mocked(tagUntagAssets);
const mockGetAllTags = vi.mocked(getAllTags);
const mockGetAllTagsForAssets = vi.mocked(getAllTagsForAssets);
const mockUpsertTags = vi.mocked(upsertTags);

describe('AssetTagModal component', () => {
  const onClose = vi.fn();

  const getTagPills = () => screen.queryAllByTestId('tag-pill-label');
  const getTagPillRemoveButtons = () => screen.queryAllByTestId('tag-pill-remove-button');
  const getTagsCombobox = () => screen.getByRole('combobox');
  const getTagComboboxOptions = () => screen.queryAllByRole('option');

  const simpleTag: TagResponseDto = {
    id: 'tag-id',
    value: 'Tag',
    color: '#ff0000',
    parentId: undefined,
    name: 'Tag',
    createdAt: '',
    updatedAt: '',
  };

  const parentTag: TagResponseDto = {
    id: 'tag-id-parent',
    value: 'TagParent',
    color: '#ff0000',
    parentId: undefined,
    name: 'TagParent',
    createdAt: '',
    updatedAt: '',
  };

  const childTag: TagResponseDto = {
    id: 'tag-id-child',
    value: 'TagParent/TagChild',
    color: '#ff0000',
    parentId: 'tag-id-parent',
    name: 'TagChild',
    createdAt: '',
    updatedAt: '',
  };

  const tagDtos = [simpleTag, parentTag, childTag] as TagResponseDto[];

  beforeEach(() => {
    vi.stubGlobal('IntersectionObserver', getIntersectionObserverMock());
    vi.stubGlobal('visualViewport', getVisualViewportMock());
    vi.resetAllMocks();
    Element.prototype.animate = getAnimateMock();
  });

  afterAll(async () => {
    await waitFor(() => {
      expect(document.body.style.pointerEvents).not.toBe('none');
    });
  });

  test('renders combobox with available tags', async () => {
    mockGetAllTags.mockResolvedValueOnce(tagDtos);
    mockGetAllTagsForAssets.mockResolvedValueOnce([] as TagsForAssetsResponseDto[]);

    render(AssetTagModal, {
      props: {
        assetIds: ['asset-id'],
        onClose,
      },
    });

    await waitFor(() => {
      expect(mockGetAllTagsForAssets).toHaveBeenCalled();
    });

    await fireEvent.focus(getTagsCombobox());
    const options = getTagComboboxOptions();
    expect(options.length).toBe(tagDtos.length);
    expect(options[0]).toHaveTextContent(simpleTag.value);
    expect(options[1]).toHaveTextContent(parentTag.value);
    expect(options[2]).toHaveTextContent(childTag.value);
  });

  test('does not render tag pills if no existing tags present', async () => {
    mockGetAllTags.mockResolvedValueOnce(tagDtos);
    mockGetAllTagsForAssets.mockResolvedValueOnce([] as TagsForAssetsResponseDto[]);

    render(AssetTagModal, {
      props: {
        assetIds: ['asset-id'],
        onClose,
      },
    });

    await waitFor(() => {
      expect(mockGetAllTagsForAssets).toHaveBeenCalled();
    });

    const tagPills = getTagPills();
    expect(tagPills.length).toBe(0);
  });

  test('renders tag pills if existing tags are present', async () => {
    mockGetAllTags.mockResolvedValueOnce(tagDtos);
    mockGetAllTagsForAssets.mockResolvedValueOnce([
      { tagId: simpleTag.id, assetIds: ['asset-id'] },
      { tagId: parentTag.id, assetIds: ['asset-id'] },
    ] as TagsForAssetsResponseDto[]);

    render(AssetTagModal, {
      props: {
        assetIds: ['asset-id'],
        onClose,
      },
    });

    await waitFor(() => {
      expect(mockGetAllTagsForAssets).toHaveBeenCalled();
    });

    const tagPills = getTagPills();
    expect(tagPills.length).toBe(2);
    expect(tagPills[0]).toHaveTextContent(simpleTag.value);
    expect(tagPills[1]).toHaveTextContent(parentTag.value);
  });

  test('removes available tags from combobox as they are selected and displays as pills', async () => {
    mockGetAllTags.mockResolvedValueOnce(tagDtos);
    mockGetAllTagsForAssets.mockResolvedValueOnce([] as TagsForAssetsResponseDto[]);

    render(AssetTagModal, {
      props: {
        assetIds: ['asset-id'],
        onClose,
      },
    });

    await waitFor(() => {
      expect(mockGetAllTagsForAssets).toHaveBeenCalled();
    });

    // Select first option (simpleTag)
    await fireEvent.focus(getTagsCombobox());
    let options = getTagComboboxOptions();
    await fireEvent.click(options[0]);

    // Check simpleTag is added as pill
    let tagPills = getTagPills();
    expect(tagPills.length).toBe(1);
    expect(tagPills[0]).toHaveTextContent(simpleTag.value);

    // Check simpleTag is removed from options
    await fireEvent.focus(getTagsCombobox());
    options = getTagComboboxOptions();
    expect(options.length).toBe(tagDtos.length - 1);
    expect(options[0]).toHaveTextContent(parentTag.value);
    expect(options[1]).toHaveTextContent(childTag.value);

    // Select second option (parentTag)
    await fireEvent.click(options[0]);

    // Check parentTag is added as pill
    tagPills = getTagPills();
    expect(tagPills.length).toBe(2);
    expect(tagPills[1]).toHaveTextContent(parentTag.value);

    // Check parentTag is removed from options
    await fireEvent.focus(getTagsCombobox());
    options = getTagComboboxOptions();
    expect(options.length).toBe(tagDtos.length - 2);
    expect(options[0]).toHaveTextContent(childTag.value);
  });

  test('makes tags available in combobox if the remove button is clicked on pill', async () => {
    mockGetAllTags.mockResolvedValueOnce(tagDtos);
    mockGetAllTagsForAssets.mockResolvedValueOnce([
      { tagId: simpleTag.id, assetIds: ['asset-id'] },
      { tagId: parentTag.id, assetIds: ['asset-id'] },
    ] as TagsForAssetsResponseDto[]);

    render(AssetTagModal, {
      props: {
        assetIds: ['asset-id'],
        onClose,
      },
    });

    await waitFor(() => {
      expect(mockGetAllTagsForAssets).toHaveBeenCalled();
    });

    const tagPillRemoveButtons = getTagPillRemoveButtons();
    expect(tagPillRemoveButtons.length).toBe(2);

    // Click remove button on first pill (simpleTag)
    await fireEvent.click(tagPillRemoveButtons[0]);

    // Check simpleTag pill is removed
    const tagPills = getTagPills();
    expect(tagPills.length).toBe(1);
    expect(tagPills[0]).toHaveTextContent(parentTag.value);

    // Check simpleTag is back in options
    await fireEvent.focus(getTagsCombobox());
    const options = getTagComboboxOptions();
    expect(options.length).toBe(tagDtos.length - 1);
    expect(options[0]).toHaveTextContent(simpleTag.value);
    expect(options[1]).toHaveTextContent(childTag.value);
  });

  test('renders pill as partial if only some assets have that tag', async () => {
    mockGetAllTags.mockResolvedValueOnce(tagDtos);
    mockGetAllTagsForAssets.mockResolvedValueOnce([
      { tagId: simpleTag.id, assetIds: ['asset-id', 'asset-id2'] },
      { tagId: parentTag.id, assetIds: ['asset-id'] },
    ] as TagsForAssetsResponseDto[]);

    render(AssetTagModal, {
      props: {
        assetIds: ['asset-id', 'asset-id2'],
        onClose,
      },
    });

    await waitFor(() => {
      expect(mockGetAllTagsForAssets).toHaveBeenCalled();
    });

    // One tag should have bg-primary class, the other should have bg-grey-500 class indicating partial
    const tagPills = getTagPills();
    expect(tagPills.length).toBe(2);
    expect(tagPills[0]).toHaveClass('bg-primary');
    expect(tagPills[1]).toHaveClass('bg-gray-500');
  });

  test('allows partial tag to be selected in dropdown, and turns into full tag when selected', async () => {
    mockGetAllTags.mockResolvedValueOnce(tagDtos);
    mockGetAllTagsForAssets.mockResolvedValueOnce([
      { tagId: simpleTag.id, assetIds: ['asset-id', 'asset-id2'] },
      { tagId: parentTag.id, assetIds: ['asset-id'] },
    ] as TagsForAssetsResponseDto[]);

    render(AssetTagModal, {
      props: {
        assetIds: ['asset-id', 'asset-id2'],
        onClose,
      },
    });

    await waitFor(() => {
      expect(mockGetAllTagsForAssets).toHaveBeenCalled();
    });

    // Partial tag should be available in tag dropdown, full tag should not
    await fireEvent.focus(getTagsCombobox());
    let options = getTagComboboxOptions();
    expect(options.length).toBe(2);
    expect(options[0]).toHaveTextContent(parentTag.value);
    expect(options[1]).toHaveTextContent(childTag.value);

    // Select partial tag option (parentTag)
    await fireEvent.click(options[0]);

    // Both tag pills should now have bg primary class indicating they are full tags
    const tagPills = getTagPills();
    expect(tagPills.length).toBe(2);
    expect(tagPills[0]).toHaveClass('bg-primary');
    expect(tagPills[1]).toHaveClass('bg-primary');

    // Partial tag (that is now full) should be removed from tag dropdown
    await fireEvent.focus(getTagsCombobox());
    options = getTagComboboxOptions();
    expect(options.length).toBe(1);
    expect(options[0]).toHaveTextContent(childTag.value);
  });

  test('filters the list of available tags in the combobox when search string entered', async () => {
    mockGetAllTags.mockResolvedValueOnce(tagDtos);
    mockGetAllTagsForAssets.mockResolvedValueOnce([] as TagsForAssetsResponseDto[]);

    render(AssetTagModal, {
      props: {
        assetIds: ['asset-id'],
        onClose,
      },
    });

    await waitFor(() => {
      expect(mockGetAllTagsForAssets).toHaveBeenCalled();
    });

    const combobox = getTagsCombobox();
    await fireEvent.focus(combobox);
    await fireEvent.input(combobox, { target: { value: 'TagParent' } });
    const options = getTagComboboxOptions();
    expect(options.length).toBe(2);
    expect(options[0]).toHaveTextContent(parentTag.value);
    expect(options[1]).toHaveTextContent(childTag.value);
  });

  test('adds a new tag when text entered in the combobox does not match an existing tag', async () => {
    mockGetAllTags.mockResolvedValueOnce(tagDtos);
    mockGetAllTagsForAssets.mockResolvedValueOnce([] as TagsForAssetsResponseDto[]);
    mockUpsertTags.mockResolvedValueOnce([
      {
        id: 'new-tag-id',
        value: 'NewTag',
        color: '#ff0000',
        parentId: undefined,
        name: 'NewTag',
        createdAt: '',
        updatedAt: '',
      },
    ] as TagResponseDto[]);

    render(AssetTagModal, {
      props: {
        assetIds: ['asset-id'],
        onClose,
      },
    });

    await waitFor(() => {
      expect(mockGetAllTagsForAssets).toHaveBeenCalled();
    });

    const combobox = getTagsCombobox();
    await fireEvent.focus(combobox);
    await fireEvent.input(combobox, { target: { value: 'NewTag' } });
    await fireEvent.keyDown(combobox, { key: 'Enter', code: 'Enter' });

    expect(mockUpsertTags).toHaveBeenCalledWith({ tagUpsertDto: { tags: ['NewTag'] } });

    const tagPills = getTagPills();
    expect(tagPills.length).toBe(1);
    expect(tagPills[0]).toHaveClass('bg-primary');
    expect(tagPills[0]).toHaveTextContent('NewTag');
  });

  test('displays confirmation dialog with correct asset count if modifying tags for over 40 assets', async () => {
    mockGetAllTags.mockResolvedValueOnce(tagDtos);
    mockGetAllTagsForAssets.mockResolvedValueOnce([] as TagsForAssetsResponseDto[]);

    render(AssetTagModal, {
      props: {
        assetIds: Array.from({ length: 41 }).fill('asset-id') as string[],
        onClose,
      },
    });

    await waitFor(() => {
      expect(mockGetAllTagsForAssets).toHaveBeenCalled();
    });

    await fireEvent.focus(getTagsCombobox());
    const options = getTagComboboxOptions();
    await fireEvent.click(options[0]);

    // Click save button
    await fireEvent.click(screen.getByRole('button', { name: /save tags/i }));

    expect(screen.getByText(/modify_tags_confirmation/i)).toBeInTheDocument();
  });

  test('calls tagUntagAssets correctly with the correct set of tag/asset ids', async () => {
    const addedTag1: TagResponseDto = {
      id: 'tag-id-added1',
      value: 'TagAdded1',
      color: '#ff0000',
      parentId: undefined,
      name: 'TagAdded1',
      createdAt: '',
      updatedAt: '',
    };
    const addedTag2: TagResponseDto = {
      id: 'tag-id-added2',
      value: 'TagAdded2',
      color: '#ff0000',
      parentId: undefined,
      name: 'TagAdded2',
      createdAt: '',
      updatedAt: '',
    };
    const tagDtosLocal = [...tagDtos, addedTag1, addedTag2] as TagResponseDto[];

    mockGetAllTags.mockResolvedValueOnce(tagDtosLocal);
    mockGetAllTagsForAssets.mockResolvedValueOnce([
      { tagId: simpleTag.id, assetIds: ['asset-id', 'asset-id2', 'asset-id3'] },
      { tagId: parentTag.id, assetIds: ['asset-id', 'asset-id2'] },
      { tagId: childTag.id, assetIds: ['asset-id'] },
    ] as TagsForAssetsResponseDto[]);

    render(AssetTagModal, {
      props: {
        assetIds: ['asset-id', 'asset-id2', 'asset-id3'],
        onClose,
      },
    });

    await waitFor(() => {
      expect(mockGetAllTagsForAssets).toHaveBeenCalled();
    });

    // Remove an existing full tag and partial tag first
    const tagPillRemoveButtons = getTagPillRemoveButtons();
    expect(tagPillRemoveButtons.length).toBe(3);
    await fireEvent.click(tagPillRemoveButtons[0]);
    await fireEvent.click(tagPillRemoveButtons[1]);

    // Add two new tags using the combobox
    await fireEvent.focus(getTagsCombobox());
    let options = getTagComboboxOptions();
    expect(options.length).toBe(5);
    await fireEvent.click(options[4]);
    await fireEvent.focus(getTagsCombobox());
    options = getTagComboboxOptions();
    expect(options.length).toBe(4);
    await fireEvent.click(options[3]);

    // Click save button
    await fireEvent.click(screen.getByRole('button', { name: /save tags/i }));

    // Check tagAssets is called with correct tag and asset ids
    // The partial tag ID should not be included in the tag ids to add.
    expect(mockTagUntagAssets).toHaveBeenCalledWith({
      assetIds: ['asset-id', 'asset-id2', 'asset-id3'],
      showNotification: false,
      tagIdsToAdd: [addedTag2.id, addedTag1.id],
      tagIdsToRemove: [simpleTag.id, parentTag.id],
    });
  });
});
