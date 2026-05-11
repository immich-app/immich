import {
  Action,
  ClassificationFaceExclusion,
  getConfig,
  scanClassification,
  updateConfig,
  type SystemConfigDto,
} from '@immich/sdk';
import { modalManager, toastManager } from '@immich/ui';
import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ClassificationSettings from './ClassificationSettings.svelte';

vi.mock('@immich/sdk', () => ({
  getConfig: vi.fn(),
  updateConfig: vi.fn(),
  scanClassification: vi.fn(),
  Action: { Tag: 'tag', TagAndArchive: 'tag_and_archive' },
  ClassificationFaceExclusion: {
    Off: 'off',
    AnyAssignedFace: 'any_assigned_face',
    NamedPeople: 'named_people',
    NamedVisiblePeople: 'named_visible_people',
  },
}));

const mockFeatureFlags = { configFile: false, smartSearch: true, trash: true };
vi.mock(import('$lib/managers/feature-flags-manager.svelte'), () => ({
  featureFlagsManager: {
    init: vi.fn(),
    loadFeatureFlags: vi.fn(),
    get value() {
      return mockFeatureFlags;
    },
  } as never,
}));

vi.mock('@immich/ui', async (original) => {
  const mod = await original<typeof import('@immich/ui')>();
  return {
    ...mod,
    // Replace IconButton with a plain button to avoid Tooltip.Provider context requirement
    IconButton: mod.Button,
    toastManager: { primary: vi.fn(), success: vi.fn(), danger: vi.fn() },
    modalManager: { showDialog: vi.fn(), show: vi.fn() },
  };
});

const makeConfig = (categories: SystemConfigDto['classification']['categories'] = []): SystemConfigDto =>
  ({
    classification: { enabled: true, categories },
  }) as unknown as SystemConfigDto;

const makeCategory = (
  overrides: Partial<SystemConfigDto['classification']['categories'][number]> = {},
): SystemConfigDto['classification']['categories'][number] => ({
  name: 'Screenshots',
  prompts: ['a screenshot'],
  similarity: 0.28,
  action: Action.Tag,
  faceExclusion: ClassificationFaceExclusion.Off,
  enabled: true,
  ...overrides,
});

describe('ClassificationSettings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFeatureFlags.configFile = false;
    vi.mocked(getConfig).mockResolvedValue(makeConfig());
    vi.mocked(updateConfig).mockResolvedValue(void 0 as unknown as SystemConfigDto);
    // @ts-expect-error mock returns void but SDK type is string
    vi.mocked(scanClassification).mockResolvedValue(void 0);
  });

  it('should render empty state when no categories', async () => {
    render(ClassificationSettings);
    await waitFor(() => {
      expect(screen.getByText('No classification categories yet. Add one to get started.')).toBeInTheDocument();
    });
  });

  it('should render categories from config', async () => {
    vi.mocked(getConfig).mockResolvedValue(makeConfig([makeCategory()]));
    render(ClassificationSettings);
    await waitFor(() => {
      expect(screen.getByText('Screenshots')).toBeInTheDocument();
    });
  });

  it('should show create form when Add Category is clicked', async () => {
    render(ClassificationSettings);
    await waitFor(() => {
      expect(screen.getByText('Add Category')).toBeInTheDocument();
    });

    await fireEvent.click(screen.getByText('Add Category'));

    expect(screen.getByText('New Category')).toBeInTheDocument();
    expect(screen.getByLabelText('Name')).toBeInTheDocument();
  });

  it('should save new category via updateConfig', async () => {
    render(ClassificationSettings);
    await waitFor(() => {
      expect(screen.getByText('Add Category')).toBeInTheDocument();
    });

    await fireEvent.click(screen.getByText('Add Category'));

    await fireEvent.input(screen.getByLabelText('Name'), { target: { value: 'Receipts' } });
    await fireEvent.input(screen.getByLabelText('Prompts (one per line)'), { target: { value: 'a receipt' } });

    await fireEvent.click(screen.getByText('Save'));

    await waitFor(() => {
      expect(updateConfig).toHaveBeenCalledWith({
        systemConfigDto: expect.objectContaining({
          classification: expect.objectContaining({
            categories: [
              expect.objectContaining({
                name: 'Receipts',
                prompts: ['a receipt'],
              }),
            ],
          }),
        }),
      });
    });
  });

  it('should show rescan dialog when similarity is increased', async () => {
    vi.mocked(getConfig).mockResolvedValue(makeConfig([makeCategory({ similarity: 0.28 })]));
    vi.mocked(modalManager.showDialog).mockResolvedValue(false);

    render(ClassificationSettings);
    await waitFor(() => {
      expect(screen.getByText('Screenshots')).toBeInTheDocument();
    });

    await fireEvent.click(screen.getByLabelText('Edit'));

    const slider = screen.getByRole('slider');
    await fireEvent.input(slider, { target: { value: '0.40' } });

    await fireEvent.click(screen.getByText('Save'));

    await waitFor(() => {
      expect(modalManager.showDialog).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Rescan photos?',
        }),
      );
    });
  });

  it('should trigger scan when rescan dialog is confirmed', async () => {
    vi.mocked(getConfig).mockResolvedValue(makeConfig([makeCategory({ similarity: 0.28 })]));
    vi.mocked(modalManager.showDialog).mockResolvedValue(true);

    render(ClassificationSettings);
    await waitFor(() => {
      expect(screen.getByText('Screenshots')).toBeInTheDocument();
    });

    await fireEvent.click(screen.getByLabelText('Edit'));
    await fireEvent.input(screen.getByRole('slider'), { target: { value: '0.40' } });
    await fireEvent.click(screen.getByText('Save'));

    await waitFor(() => {
      expect(scanClassification).toHaveBeenCalled();
      expect(toastManager.primary).toHaveBeenCalledWith('Rescan started — existing auto-tags will be re-evaluated');
    });
  });

  it('should NOT show rescan dialog when similarity is decreased', async () => {
    vi.mocked(getConfig).mockResolvedValue(makeConfig([makeCategory({ similarity: 0.35 })]));

    render(ClassificationSettings);
    await waitFor(() => {
      expect(screen.getByText('Screenshots')).toBeInTheDocument();
    });

    await fireEvent.click(screen.getByLabelText('Edit'));
    await fireEvent.input(screen.getByRole('slider'), { target: { value: '0.20' } });
    await fireEvent.click(screen.getByText('Save'));

    await waitFor(() => {
      expect(updateConfig).toHaveBeenCalled();
    });

    expect(modalManager.showDialog).not.toHaveBeenCalled();
  });

  it('should allow saving very loose similarity thresholds', async () => {
    vi.mocked(getConfig).mockResolvedValue(makeConfig([makeCategory({ similarity: 0.28 })]));

    render(ClassificationSettings);
    await waitFor(() => {
      expect(screen.getByText('Screenshots')).toBeInTheDocument();
    });

    await fireEvent.click(screen.getByLabelText('Edit'));

    const slider = screen.getByRole('slider');
    expect(slider).toHaveAttribute('min', '0.01');
    expect(slider).toHaveAttribute('max', '1');
    expect(
      screen.getByText('Start around 0.15-0.30, then lower for broader matches or raise for stricter matches.'),
    ).toBeInTheDocument();

    await fireEvent.input(slider, { target: { value: '0.11' } });
    await fireEvent.click(screen.getByText('Save'));

    await waitFor(() => {
      expect(updateConfig).toHaveBeenCalledWith({
        systemConfigDto: expect.objectContaining({
          classification: expect.objectContaining({
            categories: [expect.objectContaining({ similarity: 0.11 })],
          }),
        }),
      });
    });
  });

  it('should allow saving very strict similarity thresholds', async () => {
    vi.mocked(getConfig).mockResolvedValue(makeConfig([makeCategory({ similarity: 0.28 })]));

    render(ClassificationSettings);
    await waitFor(() => {
      expect(screen.getByText('Screenshots')).toBeInTheDocument();
    });

    await fireEvent.click(screen.getByLabelText('Edit'));
    await fireEvent.input(screen.getByRole('slider'), { target: { value: '0.80' } });
    await fireEvent.click(screen.getByText('Save'));

    await waitFor(() => {
      expect(updateConfig).toHaveBeenCalledWith({
        systemConfigDto: expect.objectContaining({
          classification: expect.objectContaining({
            categories: [expect.objectContaining({ similarity: 0.8 })],
          }),
        }),
      });
    });
  });

  it('should NOT show rescan dialog when creating a new category', async () => {
    render(ClassificationSettings);
    await waitFor(() => {
      expect(screen.getByText('Add Category')).toBeInTheDocument();
    });

    await fireEvent.click(screen.getByText('Add Category'));
    await fireEvent.input(screen.getByLabelText('Name'), { target: { value: 'Test' } });
    await fireEvent.input(screen.getByLabelText('Prompts (one per line)'), { target: { value: 'test prompt' } });
    await fireEvent.click(screen.getByText('Save'));

    await waitFor(() => {
      expect(updateConfig).toHaveBeenCalled();
    });

    expect(modalManager.showDialog).not.toHaveBeenCalled();
  });

  it('should call scanClassification when Scan All Libraries is confirmed', async () => {
    vi.mocked(modalManager.showDialog).mockResolvedValue(true);

    render(ClassificationSettings);
    await waitFor(() => {
      expect(screen.getByText('Scan All Libraries')).toBeInTheDocument();
    });

    await fireEvent.click(screen.getByText('Scan All Libraries'));

    await waitFor(() => {
      expect(scanClassification).toHaveBeenCalled();
    });
  });

  it('should NOT scan when Scan All Libraries dialog is cancelled', async () => {
    vi.mocked(modalManager.showDialog).mockResolvedValue(false);

    render(ClassificationSettings);
    await waitFor(() => {
      expect(screen.getByText('Scan All Libraries')).toBeInTheDocument();
    });

    await fireEvent.click(screen.getByText('Scan All Libraries'));

    await waitFor(() => {
      expect(modalManager.showDialog).toHaveBeenCalled();
    });

    expect(scanClassification).not.toHaveBeenCalled();
  });

  it('should show face exclusion dropdown when creating a category', async () => {
    render(ClassificationSettings);
    await waitFor(() => {
      expect(screen.getByText('Add Category')).toBeInTheDocument();
    });

    await fireEvent.click(screen.getByText('Add Category'));

    expect(screen.getByLabelText('Face exclusion')).toBeInTheDocument();
    expect(screen.getByLabelText('Face exclusion')).toHaveValue('off');
  });

  it('should save selected face exclusion for a new category', async () => {
    const user = userEvent.setup();
    render(ClassificationSettings);
    await waitFor(() => {
      expect(screen.getByText('Add Category')).toBeInTheDocument();
    });

    await fireEvent.click(screen.getByText('Add Category'));
    await fireEvent.input(screen.getByLabelText('Name'), { target: { value: 'Nature' } });
    await fireEvent.input(screen.getByLabelText('Prompts (one per line)'), { target: { value: 'a landscape photo' } });
    const faceExclusionSelect = screen.getByLabelText('Face exclusion') as HTMLSelectElement;
    // Svelte's select binding reads `:checked`; mirror browser behavior because happy-dom does not match it.
    const querySelectedOption = vi.spyOn(faceExclusionSelect, 'querySelector');
    querySelectedOption.mockImplementation((selector: string) => {
      if (selector === ':checked') {
        return faceExclusionSelect.selectedOptions.item(0);
      }
      return Element.prototype.querySelector.call(faceExclusionSelect, selector);
    });

    try {
      await user.selectOptions(faceExclusionSelect, ClassificationFaceExclusion.NamedVisiblePeople);
      await fireEvent.click(screen.getByText('Save'));
    } finally {
      querySelectedOption.mockRestore();
    }

    await waitFor(() => {
      expect(updateConfig).toHaveBeenCalledWith({
        systemConfigDto: expect.objectContaining({
          classification: expect.objectContaining({
            categories: [
              expect.objectContaining({
                name: 'Nature',
                faceExclusion: ClassificationFaceExclusion.NamedVisiblePeople,
              }),
            ],
          }),
        }),
      });
    });
  });

  it('should default old categories without faceExclusion to Off in the editor', async () => {
    vi.mocked(getConfig).mockResolvedValue(
      makeConfig([
        {
          name: 'Legacy',
          prompts: ['legacy prompt'],
          similarity: 0.28,
          action: Action.Tag,
          enabled: true,
        } as SystemConfigDto['classification']['categories'][number],
      ]),
    );

    render(ClassificationSettings);
    await waitFor(() => {
      expect(screen.getByText('Legacy')).toBeInTheDocument();
    });

    await fireEvent.click(screen.getByLabelText('Edit'));

    expect(screen.getByLabelText('Face exclusion')).toHaveValue('off');
  });

  it('should show non-Off face exclusion in the category summary', async () => {
    vi.mocked(getConfig).mockResolvedValue(
      makeConfig([makeCategory({ faceExclusion: ClassificationFaceExclusion.NamedPeople })]),
    );

    render(ClassificationSettings);
    await waitFor(() => {
      expect(screen.getByText('Named people')).toBeInTheDocument();
    });
  });

  it('should render summary badges in a separate wrapping row under the category name', async () => {
    const categoryName = 'Very long category name that should not collide with controls';
    vi.mocked(getConfig).mockResolvedValue(
      makeConfig([
        makeCategory({
          name: categoryName,
          action: Action.TagAndArchive,
          faceExclusion: ClassificationFaceExclusion.NamedVisiblePeople,
        }),
      ]),
    );

    render(ClassificationSettings);
    await waitFor(() => {
      expect(screen.getByText(categoryName)).toBeInTheDocument();
    });

    const nameRow = screen.getByText(categoryName).closest('.min-w-0');
    expect(nameRow).toBeInTheDocument();
    expect(nameRow).not.toHaveTextContent('Tag and archive');
    expect(nameRow).not.toHaveTextContent('Named, visible people');

    const metadataRow = screen.getByText('Tag and archive').parentElement;
    expect(metadataRow).toContainElement(screen.getByText('Named, visible people'));
    expect(metadataRow).toHaveClass('flex', 'flex-wrap', 'gap-2');
  });

  it('should disable controls when config file is active', async () => {
    mockFeatureFlags.configFile = true;
    vi.mocked(getConfig).mockResolvedValue(makeConfig([makeCategory()]));

    render(ClassificationSettings);
    await waitFor(() => {
      expect(screen.getByText('Screenshots')).toBeInTheDocument();
    });

    expect(screen.getByText('Add Category').closest('button')).toBeDisabled();
    expect(screen.getByText('Scan All Libraries').closest('button')).toBeDisabled();
  });

  it('should delete category via updateConfig', async () => {
    vi.mocked(getConfig).mockResolvedValue(
      makeConfig([makeCategory(), makeCategory({ name: 'Receipts', prompts: ['receipt'] })]),
    );

    render(ClassificationSettings);
    await waitFor(() => {
      expect(screen.getByText('Screenshots')).toBeInTheDocument();
      expect(screen.getByText('Receipts')).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByLabelText('Delete');
    await fireEvent.click(deleteButtons[0]);

    await waitFor(() => {
      expect(updateConfig).toHaveBeenCalledWith({
        systemConfigDto: expect.objectContaining({
          classification: expect.objectContaining({
            categories: [expect.objectContaining({ name: 'Receipts' })],
          }),
        }),
      });
    });
  });
});
