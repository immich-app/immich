import type { IntegrityReport } from '@immich/sdk';
import { page, userEvent } from 'vitest/browser';

export const createApp = () => {
  const button = (name: string) => page.getByRole('button', { name, exact: true });
  const main = page.getByRole('main');

  const statisticCard = (title: string) => page.getByTestId('statistic-card').filter({ hasText: title });
  const tableRow = (text: string) => page.getByRole('row').filter({ hasText: text });

  const queueCard = (title: string) =>
    page.getByTestId('queue-card').filter({ has: page.getByRole('link', { name: title, exact: true }) });

  const sidebar = page.getByTestId('sidebar-parent');
  const dialog = page.getByRole('dialog');
  const accountButton = page.getByRole('button').and(page.getByTitle(/\(.+@.+\)$/));
  const purchasePanel = dialog.filter({
    has: page.getByRole('heading', { name: 'purchase_panel_title', exact: true }),
  });
  const searchFilters = page.getByRole('listbox').first();
  const tagsSection = () => page.getByTestId('search-tags-section');

  return {
    sidebar: {
      root: sidebar,
      links: sidebar.getByRole('link'),
      purchaseInfo: {
        buyButton: sidebar.getByRole('button', { name: 'purchase_button_buy_immich' }),
        panel: purchasePanel,
        neverShowAgainButton: purchasePanel.getByRole('button', { name: 'purchase_button_never_show_again' }),
        remindMeButton: purchasePanel.getByRole('button', { name: 'purchase_button_reminder' }),
      },
    },
    navbar: {
      avatar: accountButton,
      editAvatarButton: button('edit_avatar'),
      openAvatarEditor: async () => {
        await accountButton.click();
        await button('edit_avatar').click();
      },
    },
    userPicker: {
      searchInput: dialog.getByPlaceholder('search', { exact: true }),
      user: (name: string) => dialog.getByText(name, { exact: true }),
      addButton: dialog.getByRole('button', { name: 'add', exact: true }),
    },
    gallery: {
      selectAll: () => userEvent.keyboard('{Control>}a{/Control}'),
      selectAllButton: button('select_all'),
    },
    search: {
      filters: searchFilters,
      open: () => page.getByRole('combobox', { name: 'search_your_photos' }).click(),
      openFilter: async (name: string) => {
        await page.getByRole('combobox', { name: 'search_your_photos' }).click();
        await searchFilters.getByRole('button', { name, exact: true }).click();
      },
      submit: () => searchFilters.getByRole('button', { name: 'search', exact: true }).click(),
      startDate: page.getByRole('spinbutton'),
      customDateButton: searchFilters.getByRole('button', { name: 'search_filter_date_custom', exact: true }),
      showAdvanced: () => searchFilters.getByRole('button', { name: 'advanced_filters' }).click(),
      pick: async (label: string, option: string) => {
        await searchFilters.getByRole('combobox', { name: label, exact: true }).click();
        await page.getByRole('option', { name: option, exact: true }).click();
      },
      combobox: (label: string) => searchFilters.getByRole('combobox', { name: label, exact: true }),
      openCombobox: (label: string) => searchFilters.getByRole('combobox', { name: label, exact: true }).click(),
      option: (name: string) => page.getByRole('option', { name, exact: true }),
      removeChipButtons: page.getByRole('button', { name: 'remove_filter', exact: true }),
      tags: {
        section: tagsSection,
        chip: (name: string) => tagsSection().getByRole('button', { name, exact: true }),
        untaggedButton: () => tagsSection().getByRole('button', { name: 'untagged', exact: true }),
      },
    },
    explore: {
      recentlyAdded: page.getByRole('button', { name: 'image_alt_text_date', exact: true }),
      assetViewer: page.getByTestId('viewer-content'),
      person: (name: string) => main.getByRole('link').filter({ hasText: name }),
    },
    places: {
      card: (city: string) => page.getByRole('img', { name: city, exact: true }),
    },
    admin: {
      maintenance: {
        restoreBackupButton: page.getByRole('button', { name: /^admin\.maintenance_restore_database_backup/ }),
        startButton: button('admin.maintenance_start'),
        checkButton: (report: IntegrityReport) =>
          statisticCard(`admin.maintenance_integrity_${report}`).getByRole('button', {
            name: 'admin.maintenance_integrity_check',
            exact: true,
          }),
        backup: (filename: string) => page.getByText(filename, { exact: true }),
        backupRestoreButton: page.getByRole('list').getByRole('button', { name: 'restore', exact: true }),
        backupMenuButton: page.getByRole('list').getByRole('button', { name: 'open', exact: true }),
        deleteMenuItem: page.getByRole('menuitem', { name: 'delete', exact: true }),
      },
      integrityReport: {
        row: tableRow,
        rowMenuButton: (path: string) => tableRow(path).getByRole('button', { name: 'open', exact: true }),
        deleteMenuItem: page.getByRole('menuitem', { name: 'delete', exact: true }),
        deleteAllButton: button('trash_page_delete_all'),
        loadMoreButton: button('load_more'),
      },
      queues: {
        card: queueCard,
        pauseButton: (title: string) => queueCard(title).getByRole('button', { name: 'pause', exact: true }),
        resumeButton: (title: string) => queueCard(title).getByRole('button', { name: 'resume', exact: true }),
        clearButton: (title: string) => queueCard(title).getByRole('button', { name: 'clear', exact: true }),
        resetButton: (title: string) => queueCard(title).getByRole('button', { name: 'reset', exact: true }),
        resumePausedButton: button('resume_paused_jobs'),
        count: (title: string, count: number) => queueCard(title).getByText(String(count), { exact: true }),
        pausedBadge: (title: string) => queueCard(title).getByText('paused', { exact: true }),
        anyPausedBadge: page.getByText('paused', { exact: true }),
        reprocessAllFacesMessage: page
          .getByRole('dialog')
          .getByText('admin.confirm_reprocess_all_faces', { exact: true }),
      },
      queue: {
        heading: (title: string) => page.getByRole('heading', { name: title, exact: true }),
        pausedBadge: page.getByText('paused', { exact: true }),
        failedCount: page.getByText('failed_count', { exact: true }),
        pauseButton: button('pause'),
        resumeButton: button('resume'),
        clearButton: button('clear'),
        removeFailedJobsButton: button('admin.remove_failed_jobs'),
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
      optionsMenuButton: button('album_options'),
      deleteMenuItem: page.getByRole('menuitem', { name: 'delete_album', exact: true }),
      leaveMenuItem: page.getByRole('menuitem', { name: 'leave_album', exact: true }),
      descriptionInput: page.getByTestId('autogrow-textarea'),
      commentsButton: button('activity'),
      likeButton: page.getByRole('button', { name: 'like', exact: true, pressed: false }),
      likedButton: page.getByRole('button', { name: 'like', exact: true, pressed: true }),
      activity: {
        commentInput: page.getByPlaceholder('say_something'),
        sendButton: button('send_message'),
        commentMenu: (index: number) => button('comment_options').nth(index),
        removeMenuItem: page.getByRole('menuitem', { name: 'remove', exact: true }),
      },
    },
    confirmButton: page.getByRole('dialog').getByRole('button', { name: 'confirm', exact: true }),
    dialogButton: (name: string) => page.getByRole('dialog').getByRole('button', { name, exact: true }),
    cancelButton: page.getByRole('dialog').getByRole('button', { name: 'cancel', exact: true }),
    duplicates: {
      keepToggle: (index: number) => button('keep').nth(index),
      stackButton: button('stack'),
      trashButton: button('trash_count'),
      deduplicateAllButton: button('deduplicate_all'),
      keepAllButton: button('keep_all').first(),
      groupPosition: (current: number, total: number) => page.getByText(`${current} / ${total}`),
      emptyMessage: page.getByText('no_duplicates_found'),
    },
    tags: {
      createButton: button('create_tag'),
      editButton: button('edit_tag'),
      deleteButton: button('delete_tag'),
      explorerLink: (name: string) => sidebar.getByRole('link', { name, exact: true }),
      child: (name: string) => main.getByRole('button', { name, exact: true }),
      form: {
        tagInput: page.getByLabelText('tag', { exact: true }),
        nameInput: page.getByLabelText('name', { exact: true }),
        createButton: page.getByRole('dialog').getByRole('button', { name: 'create', exact: true }),
        saveButton: page.getByRole('dialog').getByRole('button', { name: 'save', exact: true }),
        deleteButton: page.getByRole('dialog').getByRole('button', { name: 'delete', exact: true }),
      },
    },
    workflows: {
      menuButton: (index: number) => page.getByRole('button', { name: 'open', exact: true }).nth(index),
      deleteMenuItem: page.getByRole('menuitem', { name: 'delete', exact: true }),
    },
    trash: {
      emptyTrashButton: button('empty_trash'),
      restoreAllButton: button('restore_all'),
      restoreSelectedButton: button('restore'),
    },
    maintenanceMode: {
      loggedInAs: page.getByText('maintenance_logged_in_as', { exact: true }),
      endButton: button('maintenance_end'),
      restoreFromBackupButton: button('maintenance_restore_from_backup'),
    },
    settings: {
      manageOauthAccountLink: page.getByRole('link', { name: 'manage_oauth_account', exact: true }),
      section: (title: string) => page.getByRole('button', { name: new RegExp(`^${title}`) }),
      rotateApiKeyButton: button('rotate_key'),
      apiKeySecretDoneButton: page.getByRole('dialog').getByRole('button', { name: 'done', exact: true }),
      deleteApiKeyButton: button('delete_key'),
      deletePasskeyButton: button('delete_passkey'),
      logOutDeviceButton: button('log_out'),
      logOutAllDevicesButton: button('log_out_all_devices'),
      pinCodeTitle: (title: string) => main.getByText(title, { exact: true }),
      partners: {
        addButton: button('add_partner'),
        removeButton: button('stop_sharing_photos_with_user'),
        showInTimelineSwitch: page.getByRole('switch', { name: 'show_in_timeline', exact: true }),
      },
      clusterGroup: {
        addUserButton: button('add_user'),
        leaveButton: button('leave'),
        facialRecognitionButton: button('cluster_group_facial_recognition'),
        viewGroupButton: button('view_group'),
        cancelRequestButton: main.getByRole('button', { name: 'cancel', exact: true }),
      },
    },
    people: {
      nameInput: (index: number) => main.getByPlaceholder('add_a_name').nth(index),
      mergeDialog: (name: string) => page.getByRole('dialog').getByText(`merge_people - ${name}`, { exact: true }),
      declineMergeButton: page.getByRole('dialog').getByRole('button', { name: 'no', exact: true }),
      manage: {
        hideButtons: page.getByRole('button', { name: 'hide_named_person' }),
        hidden: page.getByRole('button', { pressed: true }),
        doneButton: button('done'),
      },
    },
  };
};

export type App = ReturnType<typeof createApp>;
