import { goto } from '$app/navigation';
import { ADMIN_VISIBLE_QUEUES } from '$lib/constants';
import { authManager } from '$lib/managers/auth-manager.svelte';
import { Route } from '$lib/route';
import * as albumService from '$lib/services/album.service';
import * as albumUtils from '$lib/utils/album-utils';
import * as fileUploader from '$lib/utils/file-uploader';
import * as handleErrorModule from '$lib/utils/handle-error';
import type { AlbumResponseDto, SharedSpaceMemberResponseDto, SharedSpaceResponseDto } from '@immich/sdk';
import * as sdk from '@immich/sdk';
import { QueueCommand, QueueName, SharedSpaceRole } from '@immich/sdk';
import { modalManager, toastManager } from '@immich/ui';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import AlbumEditModal from '../modals/AlbumEditModal.svelte';
import AlbumOptionsModal from '../modals/AlbumOptionsModal.svelte';
import ShortcutsModal from '../modals/ShortcutsModal.svelte';
import SpaceAddMemberModal from '../modals/SpaceAddMemberModal.svelte';
import SpaceCreateModal from '../modals/SpaceCreateModal.svelte';
import SpaceMembersModal from '../modals/SpaceMembersModal.svelte';
import type { CommandContext } from './command-context-manager.svelte';
import { COMMAND_ITEMS, isAlmostExactCommandMatch, type CommandItem } from './command-items';

vi.mock('@immich/ui', async (orig) => {
  const actual = await orig<typeof import('@immich/ui')>();
  return {
    ...actual,
    modalManager: { show: vi.fn().mockResolvedValue(undefined) },
    toastManager: { info: vi.fn(), primary: vi.fn(), success: vi.fn(), warning: vi.fn(), danger: vi.fn() },
  };
});

vi.mock('@immich/sdk', async (orig) => ({
  ...(await orig<typeof import('@immich/sdk')>()),
  runQueueCommandLegacy: vi.fn(),
  emptyQueue: vi.fn(),
  removeUserFromAlbum: vi.fn().mockResolvedValue(undefined),
  bulkAddAssets: vi.fn().mockResolvedValue(undefined),
  removeMember: vi.fn().mockResolvedValue(undefined),
  removeSpace: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('$app/navigation', () => ({ goto: vi.fn().mockResolvedValue(undefined) }));

vi.mock('$lib/services/album.service', () => ({
  handleDeleteAlbum: vi.fn().mockResolvedValue(true),
  handleDownloadAlbum: vi.fn().mockResolvedValue(undefined),
}));

const { mockUser } = vi.hoisted(() => ({
  mockUser: { current: { id: 'test-user' } as { id: string } | null },
}));
vi.mock('$lib/managers/auth-manager.svelte', () => ({
  authManager: {
    logout: vi.fn().mockResolvedValue(undefined),
    get authenticated() {
      return mockUser.current !== null;
    },
    get user() {
      return mockUser.current;
    },
  },
}));

beforeEach(() => {
  vi.mocked(toastManager.primary).mockClear();
  vi.mocked(toastManager.warning).mockClear();
  vi.mocked(toastManager.info).mockClear();
  vi.mocked(toastManager.danger).mockClear();
  vi.mocked(sdk.runQueueCommandLegacy).mockClear();
  vi.mocked(sdk.emptyQueue).mockClear();
  vi.restoreAllMocks();
});

describe('COMMAND_ITEMS', () => {
  it('has no duplicate ids', () => {
    const ids = new Set(COMMAND_ITEMS.map((c) => c.id));
    expect(ids.size).toBe(COMMAND_ITEMS.length);
  });
  it('all ids follow cmd:<slug> pattern', () => {
    for (const cmd of COMMAND_ITEMS) {
      expect(cmd.id).toMatch(/^cmd:[a-z][a-z0-9_]*$/);
    }
  });
  it('all entries have non-empty labelKey, descriptionKey, icon, handler', () => {
    for (const cmd of COMMAND_ITEMS) {
      expect(cmd.labelKey.length).toBeGreaterThan(0);
      expect(cmd.descriptionKey.length).toBeGreaterThan(0);
      expect(cmd.icon.length).toBeGreaterThan(0);
      expect(typeof cmd.handler).toBe('function');
    }
  });
  it('includes cmd:theme for Phase 1', () => {
    expect(COMMAND_ITEMS.find((c) => c.id === 'cmd:theme')).toBeDefined();
  });

  it('has 25 entries (7 v1.3.0 + 8 v1.3.1 + 5 v1.4 album + 5 v1.4 space)', () => {
    expect(COMMAND_ITEMS).toHaveLength(25);
  });

  it('CommandItem type allows isAvailable and destructive', () => {
    const shape: CommandItem = {
      id: 'cmd:test',
      labelKey: 'x',
      descriptionKey: 'y',
      icon: 'z',
      handler: (ctx?: CommandContext) => void ctx?.album,
      isAvailable: (ctx: CommandContext) => ctx.album !== null,
      destructive: true,
    };
    expect(shape.destructive).toBe(true);
  });

  it('all 8 v1.3.1 commands are adminOnly', () => {
    const v131Ids = [
      'cmd:run_thumbnail_gen',
      'cmd:run_metadata_extraction',
      'cmd:run_smart_search',
      'cmd:run_face_detection',
      'cmd:run_face_recognition',
      'cmd:pause_all_queues',
      'cmd:resume_all_queues',
      'cmd:clear_failed_jobs',
    ];
    for (const id of v131Ids) {
      const cmd = COMMAND_ITEMS.find((c) => c.id === id);
      expect(cmd, `expected ${id} in COMMAND_ITEMS`).toBeDefined();
      expect(cmd!.adminOnly, `expected ${id} to be adminOnly`).toBe(true);
    }
  });
});

describe('cmd:upload', () => {
  it('invokes openFileUploadDialog', async () => {
    const spy = vi.spyOn(fileUploader, 'openFileUploadDialog').mockResolvedValue(undefined as never);
    const cmd = COMMAND_ITEMS.find((c) => c.id === 'cmd:upload')!;
    await cmd.handler();
    expect(spy).toHaveBeenCalledOnce();
    spy.mockRestore();
  });
});

describe('cmd:new_album', () => {
  it('invokes createAlbumAndRedirect', async () => {
    const spy = vi.spyOn(albumUtils, 'createAlbumAndRedirect').mockResolvedValue(undefined as never);
    const cmd = COMMAND_ITEMS.find((c) => c.id === 'cmd:new_album')!;
    await cmd.handler();
    expect(spy).toHaveBeenCalledOnce();
    spy.mockRestore();
  });
});

describe('cmd:create_space', () => {
  it('opens SpaceCreateModal via modalManager', async () => {
    const spy = vi.mocked(modalManager.show).mockResolvedValue(undefined as never);
    spy.mockClear();
    const cmd = COMMAND_ITEMS.find((c) => c.id === 'cmd:create_space')!;
    await cmd.handler();
    expect(spy).toHaveBeenCalledWith(SpaceCreateModal, {});
  });
});

describe('cmd:signout', () => {
  it('shows signing-out toast and logs the user out', async () => {
    const infoSpy = vi.mocked(toastManager.info);
    const logoutSpy = vi.mocked(authManager.logout);
    infoSpy.mockClear();
    logoutSpy.mockClear();
    const cmd = COMMAND_ITEMS.find((c) => c.id === 'cmd:signout')!;
    await cmd.handler();
    expect(infoSpy).toHaveBeenCalledOnce();
    expect(logoutSpy).toHaveBeenCalledOnce();
  });
});

describe('cmd:shortcuts', () => {
  it('opens ShortcutsModal via modalManager', async () => {
    const spy = vi.mocked(modalManager.show);
    spy.mockClear();
    const cmd = COMMAND_ITEMS.find((c) => c.id === 'cmd:shortcuts')!;
    await cmd.handler();
    expect(spy).toHaveBeenCalledWith(ShortcutsModal, {});
  });
});

describe('cmd:clear_recents', () => {
  beforeEach(() => {
    localStorage.clear();
    mockUser.current = { id: 'test-user' };
  });

  it('clears recents when user is logged in', async () => {
    const key = 'cmdk.recent:test-user';
    localStorage.setItem(key, JSON.stringify([{ kind: 'query', id: 'query:a', text: 'a', lastUsed: 1 }]));
    const cmd = COMMAND_ITEMS.find((c) => c.id === 'cmd:clear_recents')!;
    await cmd.handler();
    expect(localStorage.getItem(key)).toBe(JSON.stringify([]));
  });

  it('is a no-op when user is logged out (no crash, localStorage unchanged)', () => {
    mockUser.current = null;
    localStorage.setItem('some-other-key', 'untouched');
    const cmd = COMMAND_ITEMS.find((c) => c.id === 'cmd:clear_recents')!;
    expect(() => cmd.handler()).not.toThrow();
    expect(localStorage.getItem('some-other-key')).toBe('untouched');
  });
});

describe('isAlmostExactCommandMatch', () => {
  it('returns false for queries shorter than 3 chars', () => {
    expect(isAlmostExactCommandMatch('up', 'Upload files')).toBe(false);
  });
  it('matches when a query word is a prefix of a label word', () => {
    expect(isAlmostExactCommandMatch('upload', 'Upload files')).toBe(true);
    expect(isAlmostExactCommandMatch('upl', 'Upload files')).toBe(true);
  });
  it('is case-insensitive', () => {
    expect(isAlmostExactCommandMatch('UPLOAD', 'Upload files')).toBe(true);
  });
  it('splits on non-alphanumerics', () => {
    expect(isAlmostExactCommandMatch('create-album', 'Create album')).toBe(true);
  });
});

describe.each([
  ['cmd:run_thumbnail_gen', QueueName.ThumbnailGeneration],
  ['cmd:run_metadata_extraction', QueueName.MetadataExtraction],
  ['cmd:run_smart_search', QueueName.SmartSearch],
  ['cmd:run_face_detection', QueueName.FaceDetection],
  ['cmd:run_face_recognition', QueueName.FacialRecognition],
])('%s', (id, expectedQueue) => {
  it('dispatches Start + force:false against the expected queue, shows success toast', async () => {
    const spy = vi.spyOn(sdk, 'runQueueCommandLegacy').mockResolvedValue({} as never);
    const cmd = COMMAND_ITEMS.find((c) => c.id === id)!;
    await cmd.handler();
    expect(spy).toHaveBeenCalledWith({
      name: expectedQueue,
      queueCommandDto: { command: QueueCommand.Start, force: false },
    });
    // Toast content assertion: svelte-i18n returns the raw key when no catalog
    // is loaded (setup uses fallbackLocale 'dev'), so the key IS the rendered
    // string. Catches a copy-paste firing the wrong i18n key.
    expect(toastManager.primary).toHaveBeenCalledWith(expect.stringContaining('cmdk_cmd_job_started'));
  });
});

// Shared helper — one rejection test covers the error branch for all 5 Run-X
// commands since they dispatch through `runQueue`.
it('cmd:run_thumbnail_gen: SDK rejection fires handleError (danger toast), no success toast', async () => {
  vi.spyOn(sdk, 'runQueueCommandLegacy').mockRejectedValue(new Error('boom') as never);
  const cmd = COMMAND_ITEMS.find((c) => c.id === 'cmd:run_thumbnail_gen')!;
  await cmd.handler();
  expect(toastManager.primary).not.toHaveBeenCalled();
  // handleError calls toastManager.danger — see web/src/lib/utils/handle-error.ts:44.
  expect(toastManager.danger).toHaveBeenCalled();
});

describe.each([
  ['cmd:pause_all_queues', QueueCommand.Pause, 'cmdk_cmd_all_paused'],
  ['cmd:resume_all_queues', QueueCommand.Resume, 'cmdk_cmd_all_resumed'],
])('%s', (id, expectedCommand, successKey) => {
  it('dispatches to every admin-visible queue (not all QueueName values)', async () => {
    const spy = vi.spyOn(sdk, 'runQueueCommandLegacy').mockResolvedValue({} as never);
    const cmd = COMMAND_ITEMS.find((c) => c.id === id)!;
    await cmd.handler();
    expect(spy).toHaveBeenCalledTimes(ADMIN_VISIBLE_QUEUES.length);
    for (const name of ADMIN_VISIBLE_QUEUES) {
      expect(spy).toHaveBeenCalledWith({ name, queueCommandDto: { command: expectedCommand } });
    }
    // Explicit negative: a system queue excluded from ADMIN_VISIBLE_QUEUES must NOT be touched.
    expect(spy).not.toHaveBeenCalledWith(expect.objectContaining({ name: QueueName.Notifications }));
    expect(toastManager.primary).toHaveBeenCalledWith(expect.stringContaining(successKey));
  });

  it('partial failure: some reject → warning toast fires, no success toast', async () => {
    const spy = vi
      .spyOn(sdk, 'runQueueCommandLegacy')
      .mockImplementation(({ name }) =>
        name === QueueName.ThumbnailGeneration
          ? (Promise.reject(new Error('boom')) as never)
          : (Promise.resolve({}) as never),
      );
    const cmd = COMMAND_ITEMS.find((c) => c.id === id)!;
    await cmd.handler();
    expect(spy).toHaveBeenCalledTimes(ADMIN_VISIBLE_QUEUES.length);
    // Toast assertion is key-only: svelte-i18n with no catalog loaded returns the
    // raw key AND skips ICU substitution, so interpolated {failed}/{total} values
    // can't be asserted. The reject-selection above proves the 1/14 breakdown.
    expect(toastManager.warning).toHaveBeenCalledWith(expect.stringContaining('cmdk_cmd_bulk_partial'));
    expect(toastManager.primary).not.toHaveBeenCalled();
  });

  it('total failure: all reject → warning toast fires, no success toast', async () => {
    const spy = vi.spyOn(sdk, 'runQueueCommandLegacy').mockRejectedValue(new Error('boom') as never);
    const cmd = COMMAND_ITEMS.find((c) => c.id === id)!;
    await cmd.handler();
    expect(spy).toHaveBeenCalledTimes(ADMIN_VISIBLE_QUEUES.length);
    expect(toastManager.warning).toHaveBeenCalledWith(expect.stringContaining('cmdk_cmd_bulk_partial'));
    expect(toastManager.primary).not.toHaveBeenCalled();
  });
});

describe('cmd:clear_failed_jobs', () => {
  it('calls emptyQueue with failed:true for every admin-visible queue', async () => {
    const spy = vi.spyOn(sdk, 'emptyQueue').mockResolvedValue({} as never);
    const cmd = COMMAND_ITEMS.find((c) => c.id === 'cmd:clear_failed_jobs')!;
    await cmd.handler();
    expect(spy).toHaveBeenCalledTimes(ADMIN_VISIBLE_QUEUES.length);
    for (const name of ADMIN_VISIBLE_QUEUES) {
      expect(spy).toHaveBeenCalledWith({ name, queueDeleteDto: { failed: true } });
    }
    expect(toastManager.primary).toHaveBeenCalledWith(expect.stringContaining('cmdk_cmd_failed_cleared'));
  });

  it('partial failure: warning toast fires, no success toast', async () => {
    const spy = vi
      .spyOn(sdk, 'emptyQueue')
      .mockImplementation(({ name }) =>
        name === QueueName.FaceDetection
          ? (Promise.reject(new Error('boom')) as never)
          : (Promise.resolve({}) as never),
      );
    const cmd = COMMAND_ITEMS.find((c) => c.id === 'cmd:clear_failed_jobs')!;
    await cmd.handler();
    expect(spy).toHaveBeenCalledTimes(ADMIN_VISIBLE_QUEUES.length);
    expect(toastManager.warning).toHaveBeenCalledWith(expect.stringContaining('cmdk_cmd_bulk_partial'));
    expect(toastManager.primary).not.toHaveBeenCalled();
  });

  it('total failure: warning toast fires', async () => {
    const spy = vi.spyOn(sdk, 'emptyQueue').mockRejectedValue(new Error('boom') as never);
    const cmd = COMMAND_ITEMS.find((c) => c.id === 'cmd:clear_failed_jobs')!;
    await cmd.handler();
    expect(spy).toHaveBeenCalledTimes(ADMIN_VISIBLE_QUEUES.length);
    expect(toastManager.warning).toHaveBeenCalledWith(expect.stringContaining('cmdk_cmd_bulk_partial'));
  });
});

describe('album-context commands', () => {
  const baseAlbum = {
    id: 'a1',
    albumName: 'Test',
    ownerId: 'u-owner',
  } as unknown as AlbumResponseDto;

  const makeCtx = (overrides?: Partial<CommandContext>): CommandContext => ({
    routeId: '/(user)/albums/[albumId=id]',
    params: { albumId: 'a1' },
    album: {
      id: 'a1',
      albumName: 'Test',
      ownerId: 'u-owner',
      isOwner: true,
      isMember: false,
      raw: baseAlbum,
    },
    space: null,
    userId: 'u-owner',
    isAdmin: false,
    ...overrides,
  });

  const ctxNoAlbum = (): CommandContext => ({ ...makeCtx(), album: null });
  const ctxNonOwner = (): CommandContext => ({
    ...makeCtx(),
    album: { ...makeCtx().album!, isOwner: false, isMember: true },
    userId: 'u-other',
  });
  const ctxLinkViewer = (): CommandContext => ({
    ...makeCtx(),
    album: { ...makeCtx().album!, isOwner: false, isMember: false },
    userId: 'u-stranger',
  });

  let handleErrorSpy: ReturnType<typeof vi.spyOn>;
  beforeEach(() => {
    vi.mocked(modalManager.show).mockClear();
    vi.mocked(albumService.handleDeleteAlbum).mockReset().mockResolvedValue(true);
    vi.mocked(albumService.handleDownloadAlbum).mockReset().mockResolvedValue(undefined);
    vi.mocked(sdk.removeUserFromAlbum)
      .mockReset()
      .mockResolvedValue(undefined as never);
    vi.mocked(goto).mockReset().mockResolvedValue(undefined);
    handleErrorSpy = vi.spyOn(handleErrorModule, 'handleError').mockImplementation(() => {});
  });
  afterEach(() => {
    handleErrorSpy.mockRestore();
  });

  describe('cmd:album_rename', () => {
    const cmd = () => COMMAND_ITEMS.find((c) => c.id === 'cmd:album_rename')!;
    it('hides when album is null', () => {
      expect(cmd().isAvailable!(ctxNoAlbum())).toBe(false);
    });
    it('hides for non-owners', () => {
      expect(cmd().isAvailable!(ctxNonOwner())).toBe(false);
    });
    it('shows for owner', () => {
      expect(cmd().isAvailable!(makeCtx())).toBe(true);
    });
    it('handler opens AlbumEditModal with raw DTO', async () => {
      await cmd().handler(makeCtx());
      expect(modalManager.show).toHaveBeenCalledWith(AlbumEditModal, { album: baseAlbum });
    });
  });

  describe('cmd:album_share', () => {
    const cmd = () => COMMAND_ITEMS.find((c) => c.id === 'cmd:album_share')!;
    it('hides when album is null', () => {
      expect(cmd().isAvailable!(ctxNoAlbum())).toBe(false);
    });
    it('hides for non-owners', () => {
      expect(cmd().isAvailable!(ctxNonOwner())).toBe(false);
    });
    it('shows for owner', () => {
      expect(cmd().isAvailable!(makeCtx())).toBe(true);
    });
    it('handler opens AlbumOptionsModal with raw DTO', async () => {
      await cmd().handler(makeCtx());
      expect(modalManager.show).toHaveBeenCalledWith(AlbumOptionsModal, { album: baseAlbum });
    });
  });

  describe('cmd:album_download', () => {
    const cmd = () => COMMAND_ITEMS.find((c) => c.id === 'cmd:album_download')!;
    it('hides when album is null', () => {
      expect(cmd().isAvailable!(ctxNoAlbum())).toBe(false);
    });
    it('shows for owner', () => {
      expect(cmd().isAvailable!(makeCtx())).toBe(true);
    });
    it('shows for non-owner member', () => {
      expect(cmd().isAvailable!(ctxNonOwner())).toBe(true);
    });
    it('shows for non-member link-viewer', () => {
      expect(cmd().isAvailable!(ctxLinkViewer())).toBe(true);
    });
    it('handler calls handleDownloadAlbum with raw DTO', async () => {
      await cmd().handler(makeCtx());
      expect(albumService.handleDownloadAlbum).toHaveBeenCalledWith(baseAlbum);
    });
  });

  describe('cmd:album_leave', () => {
    const cmd = () => COMMAND_ITEMS.find((c) => c.id === 'cmd:album_leave')!;
    it('hides for owners', () => {
      expect(cmd().isAvailable!(makeCtx())).toBe(false);
    });
    it('hides for non-members', () => {
      expect(cmd().isAvailable!(ctxLinkViewer())).toBe(false);
    });
    it('shows for non-owner member', () => {
      expect(cmd().isAvailable!(ctxNonOwner())).toBe(true);
    });
    it('has destructive:true', () => {
      expect(cmd().destructive).toBe(true);
    });
    it('handler calls removeUserFromAlbum then goto(Route.albums())', async () => {
      const ctx = ctxNonOwner();
      await cmd().handler(ctx);
      expect(sdk.removeUserFromAlbum).toHaveBeenCalledWith({ id: 'a1', userId: 'u-other' });
      expect(goto).toHaveBeenCalledWith(Route.albums());
    });
    it('handler calls handleError + does NOT goto on rejection', async () => {
      vi.mocked(sdk.removeUserFromAlbum).mockRejectedValueOnce(new Error('boom'));
      await cmd().handler(ctxNonOwner());
      expect(handleErrorSpy).toHaveBeenCalledOnce();
      expect(goto).not.toHaveBeenCalled();
    });
  });

  describe('cmd:album_delete', () => {
    const cmd = () => COMMAND_ITEMS.find((c) => c.id === 'cmd:album_delete')!;
    it('hides for non-owners', () => {
      expect(cmd().isAvailable!(ctxNonOwner())).toBe(false);
    });
    it('shows for owner', () => {
      expect(cmd().isAvailable!(makeCtx())).toBe(true);
    });
    it('has destructive:true', () => {
      expect(cmd().destructive).toBe(true);
    });
    it('handler calls handleDeleteAlbum({prompt:false}) + goto on success', async () => {
      await cmd().handler(makeCtx());
      expect(albumService.handleDeleteAlbum).toHaveBeenCalledWith(baseAlbum, { prompt: false });
      expect(goto).toHaveBeenCalledWith(Route.albums());
    });
    it('handler does NOT goto when handleDeleteAlbum returns falsy', async () => {
      vi.mocked(albumService.handleDeleteAlbum).mockResolvedValueOnce(false);
      await cmd().handler(makeCtx());
      expect(goto).not.toHaveBeenCalled();
    });
  });

  describe('destructive flag drift guard', () => {
    it('all cmd:album_* destructive commands have destructive:true', () => {
      for (const id of ['cmd:album_leave', 'cmd:album_delete']) {
        const cmd = COMMAND_ITEMS.find((c) => c.id === id)!;
        expect(cmd.destructive).toBe(true);
      }
    });
    it('no non-destructive cmd:album_* command is marked destructive', () => {
      for (const id of ['cmd:album_rename', 'cmd:album_share', 'cmd:album_download']) {
        const cmd = COMMAND_ITEMS.find((c) => c.id === id)!;
        expect(cmd.destructive).toBeFalsy();
      }
    });
  });
});

describe('space-context commands', () => {
  const baseSpace = {
    id: 's1',
    name: 'Shared',
    createdById: 'u-owner',
    color: 'primary',
  } as unknown as SharedSpaceResponseDto;

  const makeMember = (overrides: Partial<SharedSpaceMemberResponseDto> = {}): SharedSpaceMemberResponseDto =>
    ({
      userId: 'u-me',
      email: 'me@test.com',
      name: 'Me',
      joinedAt: '2024-01-01T00:00:00.000Z',
      role: SharedSpaceRole.Editor,
      ...overrides,
    }) as unknown as SharedSpaceMemberResponseDto;

  const makeCtx = (overrides?: Partial<CommandContext>): CommandContext => ({
    routeId: '/(user)/spaces/[spaceId]',
    params: { spaceId: 's1' },
    album: null,
    space: {
      id: 's1',
      name: 'Shared',
      createdById: 'u-owner',
      isOwner: true,
      isMember: false,
      canWrite: true,
      raw: baseSpace,
      members: [],
    },
    userId: 'u-owner',
    isAdmin: false,
    ...overrides,
  });

  const ctxNoSpace = (): CommandContext => ({ ...makeCtx(), space: null });
  const ctxEditor = (): CommandContext => ({
    ...makeCtx(),
    space: {
      ...makeCtx().space!,
      isOwner: false,
      isMember: true,
      canWrite: true,
    },
    userId: 'u-me',
  });
  const ctxViewer = (): CommandContext => ({
    ...makeCtx(),
    space: { ...makeCtx().space!, isOwner: false, isMember: true, canWrite: false },
    userId: 'u-me',
  });
  const ctxNonMember = (): CommandContext => ({
    ...makeCtx(),
    space: { ...makeCtx().space!, isOwner: false, isMember: false, canWrite: false },
    userId: 'u-stranger',
  });

  let handleErrorSpy: ReturnType<typeof vi.spyOn>;
  beforeEach(() => {
    vi.mocked(modalManager.show).mockClear();
    vi.mocked(sdk.bulkAddAssets)
      .mockReset()
      .mockResolvedValue(undefined as never);
    vi.mocked(sdk.removeMember)
      .mockReset()
      .mockResolvedValue(undefined as never);
    vi.mocked(sdk.removeSpace)
      .mockReset()
      .mockResolvedValue(undefined as never);
    vi.mocked(goto).mockReset().mockResolvedValue(undefined);
    vi.mocked(toastManager.primary).mockClear();
    handleErrorSpy = vi.spyOn(handleErrorModule, 'handleError').mockImplementation(() => {});
  });
  afterEach(() => {
    handleErrorSpy.mockRestore();
  });

  describe('cmd:space_manage_members', () => {
    const cmd = () => COMMAND_ITEMS.find((c) => c.id === 'cmd:space_manage_members')!;
    it('hides when space is null', () => {
      expect(cmd().isAvailable!(ctxNoSpace())).toBe(false);
    });
    it('hides for non-owners', () => {
      expect(cmd().isAvailable!(ctxEditor())).toBe(false);
    });
    it('shows for owner', () => {
      expect(cmd().isAvailable!(makeCtx())).toBe(true);
    });
    it('handler opens SpaceMembersModal with ctx.space.members (NOT raw.members)', async () => {
      const members = [makeMember({ userId: 'u-owner', role: SharedSpaceRole.Owner })];
      const ctx = makeCtx({ space: { ...makeCtx().space!, members } });
      await cmd().handler(ctx);
      expect(modalManager.show).toHaveBeenCalledWith(
        SpaceMembersModal,
        expect.objectContaining({ spaceId: 's1', members, isOwner: true, spaceColor: 'primary' }),
      );
    });
  });

  describe('cmd:space_add_member', () => {
    const cmd = () => COMMAND_ITEMS.find((c) => c.id === 'cmd:space_add_member')!;
    it('hides for non-owners', () => {
      expect(cmd().isAvailable!(ctxEditor())).toBe(false);
    });
    it('shows for owner', () => {
      expect(cmd().isAvailable!(makeCtx())).toBe(true);
    });
    it('handler opens SpaceAddMemberModal with existingMemberIds from ctx.space.members', async () => {
      const members = [makeMember({ userId: 'u-a' }), makeMember({ userId: 'u-b' })];
      const ctx = makeCtx({ space: { ...makeCtx().space!, members } });
      await cmd().handler(ctx);
      expect(modalManager.show).toHaveBeenCalledWith(SpaceAddMemberModal, {
        spaceId: 's1',
        existingMemberIds: ['u-a', 'u-b'],
      });
    });
  });

  describe('cmd:space_bulk_add', () => {
    const cmd = () => COMMAND_ITEMS.find((c) => c.id === 'cmd:space_bulk_add')!;
    it('hides for viewers (canWrite=false)', () => {
      expect(cmd().isAvailable!(ctxViewer())).toBe(false);
    });
    it('shows for editor (canWrite=true)', () => {
      expect(cmd().isAvailable!(ctxEditor())).toBe(true);
    });
    it('shows for owner', () => {
      expect(cmd().isAvailable!(makeCtx())).toBe(true);
    });
    it('has destructive:true', () => {
      expect(cmd().destructive).toBe(true);
    });
    it('handler calls bulkAddAssets + success toast', async () => {
      await cmd().handler(makeCtx());
      expect(sdk.bulkAddAssets).toHaveBeenCalledWith({ id: 's1' });
      expect(toastManager.primary).toHaveBeenCalledWith(expect.stringContaining('bulk_add_started'));
    });
    it('handler calls handleError + does NOT toast on rejection', async () => {
      vi.mocked(sdk.bulkAddAssets).mockRejectedValueOnce(new Error('boom'));
      await cmd().handler(makeCtx());
      expect(handleErrorSpy).toHaveBeenCalledOnce();
      expect(toastManager.primary).not.toHaveBeenCalled();
    });
  });

  describe('cmd:space_leave', () => {
    const cmd = () => COMMAND_ITEMS.find((c) => c.id === 'cmd:space_leave')!;
    it('hides for owners', () => {
      expect(cmd().isAvailable!(makeCtx())).toBe(false);
    });
    it('hides for non-members', () => {
      expect(cmd().isAvailable!(ctxNonMember())).toBe(false);
    });
    it('shows for non-owner member', () => {
      expect(cmd().isAvailable!(ctxEditor())).toBe(true);
    });
    it('has destructive:true', () => {
      expect(cmd().destructive).toBe(true);
    });
    it('handler calls removeMember + goto(Route.spaces())', async () => {
      await cmd().handler(ctxEditor());
      expect(sdk.removeMember).toHaveBeenCalledWith({ id: 's1', userId: 'u-me' });
      expect(goto).toHaveBeenCalledWith(Route.spaces());
    });
    it('handler calls handleError + NOT goto on rejection', async () => {
      vi.mocked(sdk.removeMember).mockRejectedValueOnce(new Error('boom'));
      await cmd().handler(ctxEditor());
      expect(handleErrorSpy).toHaveBeenCalledOnce();
      expect(goto).not.toHaveBeenCalled();
    });
  });

  describe('cmd:space_delete', () => {
    const cmd = () => COMMAND_ITEMS.find((c) => c.id === 'cmd:space_delete')!;
    it('hides for non-owners', () => {
      expect(cmd().isAvailable!(ctxEditor())).toBe(false);
    });
    it('shows for owner', () => {
      expect(cmd().isAvailable!(makeCtx())).toBe(true);
    });
    it('has destructive:true', () => {
      expect(cmd().destructive).toBe(true);
    });
    it('handler calls removeSpace + goto(Route.spaces())', async () => {
      await cmd().handler(makeCtx());
      expect(sdk.removeSpace).toHaveBeenCalledWith({ id: 's1' });
      expect(goto).toHaveBeenCalledWith(Route.spaces());
    });
    it('handler calls handleError + NOT goto on rejection', async () => {
      vi.mocked(sdk.removeSpace).mockRejectedValueOnce(new Error('boom'));
      await cmd().handler(makeCtx());
      expect(handleErrorSpy).toHaveBeenCalledOnce();
      expect(goto).not.toHaveBeenCalled();
    });
  });

  describe('destructive flag drift guard (full set)', () => {
    it('all cmd:album_* + cmd:space_* destructive commands have destructive:true', () => {
      const destructiveIds = [
        'cmd:album_leave',
        'cmd:album_delete',
        'cmd:space_bulk_add',
        'cmd:space_leave',
        'cmd:space_delete',
      ];
      for (const id of destructiveIds) {
        const cmd = COMMAND_ITEMS.find((c) => c.id === id)!;
        expect(cmd.destructive, id).toBe(true);
      }
    });
    it('no non-destructive cmd:album_* / cmd:space_* command is marked destructive', () => {
      const nonDestructiveIds = [
        'cmd:album_rename',
        'cmd:album_share',
        'cmd:album_download',
        'cmd:space_manage_members',
        'cmd:space_add_member',
      ];
      for (const id of nonDestructiveIds) {
        const cmd = COMMAND_ITEMS.find((c) => c.id === id)!;
        expect(cmd.destructive, id).toBeFalsy();
      }
    });
  });

  describe('route-helper drift guard', () => {
    it('command-items.ts uses Route.albums() + Route.spaces() helpers (no raw literals)', async () => {
      const { readFile } = await import('node:fs/promises');
      const src = await readFile('src/lib/managers/command-items.ts', 'utf8');
      expect(src).not.toMatch(/goto\(['"]\/(albums|spaces)['"]\)/);
      expect(src).toMatch(/Route\.albums\(\)/);
      expect(src).toMatch(/Route\.spaces\(\)/);
    });
  });
});
