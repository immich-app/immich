import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/svelte';
import type { ManagedPerson } from './people-types';
import PersonTileWrapper from './person-tile.test-wrapper.svelte';

const basePerson = (overrides: Partial<ManagedPerson> = {}): ManagedPerson => ({
  id: 'person-1',
  displayName: 'Ada Lovelace',
  thumbnailUrl: '/api/people/person-1/thumbnail',
  href: '/people/person-1',
  isHidden: false,
  ...overrides,
});

describe('PersonTile', () => {
  it('renders link, thumbnail title, favorite badge, pet badge, and footer slot', () => {
    render(PersonTileWrapper, {
      props: {
        person: basePerson({
          displayName: 'Mochi',
          isFavorite: true,
          type: 'pet',
          species: 'cat',
        }),
        showFooter: true,
      },
    });

    expect(screen.getByRole('link', { name: 'Mochi' })).toHaveAttribute('href', '/people/person-1');
    expect(screen.getByTitle('Mochi')).toHaveAttribute('src', '/api/people/person-1/thumbnail');
    expect(screen.getByLabelText('favorite')).toBeInTheDocument();
    expect(screen.getByTitle('cat')).toBeInTheDocument();
    expect(screen.getByText('Footer content')).toBeInTheDocument();
  });

  it('renders action menu slot only on hover when provided', async () => {
    render(PersonTileWrapper, {
      props: {
        person: basePerson(),
        showActionMenu: true,
      },
    });

    expect(screen.queryByRole('button', { name: 'Actions' })).not.toBeInTheDocument();

    await fireEvent.mouseEnter(screen.getByRole('group'));

    expect(screen.getByRole('button', { name: 'Actions' })).toBeInTheDocument();

    await fireEvent.mouseLeave(screen.getByRole('group'));

    expect(screen.queryByRole('button', { name: 'Actions' })).not.toBeInTheDocument();
  });

  it('keeps actions visible on mouse leave while focus remains inside and hides them after focus leaves', async () => {
    const { container } = render(PersonTileWrapper, {
      props: {
        person: basePerson(),
        showActionMenu: true,
      },
    });

    const link = screen.getByRole('link', { name: 'Ada Lovelace' });
    link.focus();
    await fireEvent.focus(link);

    expect(screen.getByRole('button', { name: 'Actions' })).toBeInTheDocument();

    const actionButton = screen.getByRole('button', { name: 'Actions' });
    actionButton.focus();
    await fireEvent.focusOut(link, { relatedTarget: actionButton });
    await fireEvent.focus(actionButton);

    await fireEvent.mouseLeave(screen.getByRole('group'));

    expect(screen.getByRole('button', { name: 'Actions' })).toBeInTheDocument();

    await fireEvent.focusOut(actionButton, { relatedTarget: document.body });

    expect(screen.queryByRole('button', { name: 'Actions' })).not.toBeInTheDocument();
    expect(container).not.toHaveTextContent('Actions');
  });

  it('does not render action menu slot when actions are disabled', async () => {
    render(PersonTileWrapper, {
      props: {
        person: basePerson(),
        showActionMenu: false,
      },
    });

    await fireEvent.mouseEnter(screen.getByRole('group'));

    expect(screen.queryByRole('button', { name: 'Actions' })).not.toBeInTheDocument();
  });

  it('does not render favorite or pet badges when person does not qualify', () => {
    render(PersonTileWrapper, {
      props: {
        person: basePerson(),
        showFooter: true,
      },
    });

    expect(screen.queryByLabelText('favorite')).not.toBeInTheDocument();
    expect(screen.queryByTitle('cat')).not.toBeInTheDocument();
  });
});
