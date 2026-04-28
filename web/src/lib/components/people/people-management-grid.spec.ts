import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import PeopleManagementGridWrapper from './people-management-grid.test-wrapper.svelte';

describe('PeopleManagementGrid', () => {
  it('renders shared person tiles with an editable canonical name footer', async () => {
    const onNameSubmit = vi.fn();
    render(PeopleManagementGridWrapper, { props: { onNameSubmit } });

    expect(screen.getByRole('link', { name: 'Ada Lovelace' })).toHaveAttribute('href', '/people/person-1');

    const input = screen.getByDisplayValue('Ada Lovelace');
    await userEvent.clear(input);
    await userEvent.type(input, 'Ada Byron');
    await fireEvent.focusOut(input);

    await waitFor(() => {
      expect(onNameSubmit).toHaveBeenCalledWith('Ada Byron', expect.objectContaining({ id: 'person-1' }));
    });
  });

  it('renders readonly names when editing is disabled', () => {
    render(PeopleManagementGridWrapper, { props: { canEditNames: false } });

    expect(screen.queryByDisplayValue('Ada Lovelace')).not.toBeInTheDocument();
    expect(screen.getByText('Ada Lovelace')).toBeInTheDocument();
  });

  it('uses the shared tile action slot and can disable actions per page', async () => {
    const onAction = vi.fn();
    const { rerender } = render(PeopleManagementGridWrapper, {
      props: { canShowActions: false, onAction },
    });

    await fireEvent.mouseEnter(screen.getByRole('group'));
    expect(screen.queryByRole('button', { name: 'Actions' })).not.toBeInTheDocument();

    await rerender({ canShowActions: true, onAction });
    await fireEvent.mouseEnter(screen.getByRole('group'));
    await userEvent.click(screen.getByRole('button', { name: 'Actions' }));

    expect(onAction).toHaveBeenCalledWith(expect.objectContaining({ id: 'person-1' }));
  });
});
