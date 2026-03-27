import { sdkMock } from '$lib/__mocks__/sdk.mock';
import TestWrapper from '$lib/components/TestWrapper.svelte';
import ClassificationSettings from '$lib/components/user-settings-page/classification-settings.svelte';
import { Action2, type ClassificationCategoryResponseDto } from '@immich/sdk';
import { render, screen, waitFor } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import type { Component } from 'svelte';
import { tick } from 'svelte';

vi.mock('$lib/utils/handle-error', () => ({
  handleError: vi.fn(),
}));

// Mock toastManager to prevent toast animations in test environment
vi.mock('@immich/ui', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@immich/ui')>();
  return {
    ...actual,
    toastManager: {
      primary: vi.fn(),
      success: vi.fn(),
      danger: vi.fn(),
      warning: vi.fn(),
      info: vi.fn(),
    },
  };
});

import { handleError } from '$lib/utils/handle-error';

const makeCategory = (
  overrides: Partial<ClassificationCategoryResponseDto> = {},
): ClassificationCategoryResponseDto => ({
  id: 'cat-1',
  name: 'Screenshots',
  prompts: ['a screenshot of a phone', 'a screenshot of a computer'],
  similarity: 0.28,
  action: Action2.Tag,
  enabled: true,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  tagId: null,
  ...overrides,
});

function renderComponent() {
  return render(
    TestWrapper as Component<{ component: typeof ClassificationSettings; componentProps: Record<string, never> }>,
    {
      component: ClassificationSettings,
      componentProps: {},
    },
  );
}

const flushAsync = async () => {
  await tick();
  await tick();
  await tick();
  await tick();
};

describe('ClassificationSettings', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    sdkMock.getCategories.mockResolvedValue([]);
  });

  it('renders "Add Category" button in empty state', async () => {
    renderComponent();
    await flushAsync();
    expect(screen.getByText('Add Category')).toBeInTheDocument();
  });

  it('renders "Scan Library" button', async () => {
    renderComponent();
    await flushAsync();
    expect(screen.getByText('Scan Library')).toBeInTheDocument();
  });

  it('opens create form when "Add Category" clicked', async () => {
    const user = userEvent.setup();
    renderComponent();
    await flushAsync();

    await user.click(screen.getByText('Add Category'));
    await flushAsync();

    expect(screen.getByText('New Category')).toBeInTheDocument();
    expect(screen.getByLabelText('Name')).toBeInTheDocument();
  });

  it('displays category name and metadata when categories loaded', async () => {
    sdkMock.getCategories.mockResolvedValue([makeCategory()]);
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Screenshots')).toBeInTheDocument();
    });

    expect(screen.getByText('Tag only')).toBeInTheDocument();
    expect(screen.getByText(/2 prompts/)).toBeInTheDocument();
    expect(screen.getByText(/Normal/)).toBeInTheDocument();
  });

  it('shows edit form when edit button clicked', async () => {
    const user = userEvent.setup();
    sdkMock.getCategories.mockResolvedValue([makeCategory()]);
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Screenshots')).toBeInTheDocument();
    });

    const editButton = screen.getByRole('button', { name: 'Edit' });
    await user.click(editButton);
    await flushAsync();

    expect(screen.getByText('Edit Category')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Screenshots')).toBeInTheDocument();
  });

  it('calls delete SDK method when delete confirmed', async () => {
    const user = userEvent.setup();
    sdkMock.getCategories.mockResolvedValueOnce([makeCategory()]);
    sdkMock.deleteCategory.mockResolvedValue(void 0 as never);
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Screenshots')).toBeInTheDocument();
    });

    sdkMock.getCategories.mockResolvedValue([]);
    const deleteButton = screen.getByRole('button', { name: 'Delete' });
    await user.click(deleteButton);

    await waitFor(() => {
      expect(sdkMock.deleteCategory).toHaveBeenCalledWith({ id: 'cat-1' });
    });
  });

  it('similarity slider renders with default value (0.28)', async () => {
    const user = userEvent.setup();
    renderComponent();
    await flushAsync();

    await user.click(screen.getByText('Add Category'));
    await flushAsync();

    expect(screen.getByText(/0\.28/)).toBeInTheDocument();
    expect(screen.getByText(/Normal/)).toBeInTheDocument();
  });

  it('error notification shown when SDK call fails', async () => {
    const error = new Error('Network error');
    sdkMock.getCategories.mockRejectedValue(error);
    renderComponent();

    await waitFor(() => {
      expect(handleError).toHaveBeenCalledWith(error, 'Unable to load classification categories');
    });
  });

  it('enabled toggle calls update SDK method', async () => {
    const user = userEvent.setup();
    sdkMock.getCategories.mockResolvedValueOnce([makeCategory({ enabled: true })]);
    sdkMock.updateCategory.mockResolvedValue(makeCategory({ enabled: false }));
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Screenshots')).toBeInTheDocument();
    });

    const switches = screen.getAllByRole('switch');
    expect(switches.length).toBeGreaterThan(0);

    sdkMock.getCategories.mockResolvedValue([makeCategory({ enabled: false })]);
    await user.click(switches[0]);

    await waitFor(() => {
      expect(sdkMock.updateCategory).toHaveBeenCalledWith({
        id: 'cat-1',
        classificationCategoryUpdateDto: { enabled: false },
      });
    });
  });

  it('create form validates non-empty name — save disabled when name empty', async () => {
    const user = userEvent.setup();
    renderComponent();
    await flushAsync();

    await user.click(screen.getByText('Add Category'));
    await flushAsync();

    const saveButton = screen.getByText('Save');
    expect(saveButton.closest('button')).toBeDisabled();
  });
});
