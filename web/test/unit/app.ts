import { page } from 'vitest/browser';

export const createApp = () => {
  const button = (name: string) => page.getByRole('button', { name, exact: true });
  const main = page.getByRole('main');

  const sidebar = page.getByTestId('sidebar-parent');
  const searchFilters = page.getByRole('listbox').first();
  const tagsSection = () => page.elementLocator(document.querySelector('#location-selection')!);

  return {
    sidebar: {
      root: sidebar,
      links: sidebar.getByRole('link'),
    },
    search: {
      filters: searchFilters,
      openFilter: async (name: string) => {
        await page.getByRole('combobox', { name: 'search_your_photos' }).click();
        await searchFilters.getByRole('button', { name, exact: true }).click();
      },
      tags: {
        section: tagsSection,
        chip: (name: string) => tagsSection().getByRole('button', { name, exact: true }),
        untaggedButton: () => tagsSection().getByRole('button', { name: 'untagged', exact: true }),
      },
    },
    admin: {
      maintenance: {
        restoreBackupButton: page.getByRole('button', { name: /^admin\.maintenance_restore_database_backup/ }),
      },
      settings: {
        open: (title: string) => page.getByRole('button', { name: title, exact: false }).click(),
        numberInput: page.getByRole('spinbutton'),
      },
    },
    albums: {
      createAlbumButton: button('create_album'),
      card: (name: string) => main.getByTestId('album-card').filter({ has: page.getByTitle(name, { exact: true }) }),
    },
    album: {
      descriptionInput: page.getByTestId('autogrow-textarea'),
      commentsButton: (count: number) => button(String(count)),
      activity: {
        commentMenu: (index: number) => button('comment_options').nth(index),
        removeMenuItem: page.getByRole('menuitem', { name: 'remove', exact: true }),
      },
    },
    trash: {
      emptyTrashButton: button('empty_trash'),
      restoreAllButton: button('restore_all'),
    },
    settings: {
      manageOauthAccountLink: page.getByRole('link', { name: 'manage_oauth_account', exact: true }),
    },
    people: {
      manage: {
        hideButtons: page.getByRole('button', { name: 'hide_named_person' }),
        hidden: page.getByRole('button', { pressed: true }),
        doneButton: button('done'),
      },
    },
  };
};

export type App = ReturnType<typeof createApp>;
