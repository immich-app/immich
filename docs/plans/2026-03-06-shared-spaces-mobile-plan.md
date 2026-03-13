# Shared Spaces Mobile — Full Feature Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement all web shared spaces features on mobile (iOS) — space management, member management, asset grid with photo add/remove, and role-based UI gating.

**Architecture:** Follow the new Drift-based architecture (`drift_remote_album.page.dart` pattern). Space detail uses `Timeline` widget with `ProviderScope` overrides on `timelineServiceProvider`. Assets are fetched from the server's timeline API with `spaceId`, converted to `RemoteAsset`, and displayed via `TimelineFactory.fromAssetsWithBuckets()`. No local Drift tables needed for v1.

**Tech Stack:** Flutter 3.35.7, Riverpod (hooks_riverpod), auto_route, OpenAPI generated client, Drift (existing only), Timeline widget system.

---

## Task 1: Repository Layer — Add Missing Methods

**Files:**

- Modify: `mobile/lib/repositories/shared_space_api.repository.dart`

**Step 1: Add updateMember, addAssets, removeAssets methods**

Add these methods to `SharedSpaceApiRepository`:

```dart
Future<SharedSpaceMemberResponseDto> updateMember(
  String spaceId,
  String userId,
  SharedSpaceRole role,
) async {
  final dto = SharedSpaceMemberUpdateDto(role: role);
  return await checkNull(_api.updateMember(spaceId, userId, dto));
}

Future<void> addAssets(String spaceId, List<String> assetIds) async {
  final dto = SharedSpaceAssetAddDto(assetIds: assetIds);
  await _api.addAssets(spaceId, dto);
}

Future<void> removeAssets(String spaceId, List<String> assetIds) async {
  final dto = SharedSpaceAssetRemoveDto(assetIds: assetIds);
  await _api.removeAssets(spaceId, dto);
}
```

**Step 2: Verify imports compile**

The OpenAPI types `SharedSpaceMemberUpdateDto`, `SharedSpaceAssetAddDto`, `SharedSpaceAssetRemoveDto` are already generated in `mobile/openapi/`. Verify they're accessible via the existing `import 'package:openapi/api.dart';`.

**Step 3: Commit**

```bash
git add mobile/lib/repositories/shared_space_api.repository.dart
git commit -m "feat(mobile): add updateMember, addAssets, removeAssets to space repository"
```

---

## Task 2: Initialize TimelineApi in ApiService

The server's timeline API supports `spaceId` filtering via `/timeline/buckets` and `/timeline/bucket`. The mobile OpenAPI client has `TimelineApi` generated but it's never initialized. We need it to fetch space assets.

**Files:**

- Modify: `mobile/lib/services/api.service.dart`

**Step 1: Add TimelineApi to ApiService**

Find the section where APIs are initialized (look for `sharedSpacesApi = SharedSpacesApi`). Add:

```dart
late TimelineApi timelineApi;
```

And in the `setEndpoint` method where other APIs are initialized, add:

```dart
timelineApi = TimelineApi(_apiClient);
```

**Step 2: Verify compilation**

Run: `cd mobile && flutter analyze lib/services/api.service.dart`

**Step 3: Commit**

```bash
git add mobile/lib/services/api.service.dart
git commit -m "feat(mobile): initialize TimelineApi in ApiService"
```

---

## Task 3: Space Asset Fetching via Timeline API

Fetch space assets using the server's timeline endpoints, convert the columnar `TimeBucketAssetResponseDto` format to `List<RemoteAsset>` for use with `TimelineFactory.fromAssetsWithBuckets()`.

**Files:**

- Modify: `mobile/lib/repositories/shared_space_api.repository.dart`

**Step 1: Add timeline API dependency and asset fetching**

Update the constructor to also accept `TimelineApi`:

```dart
class SharedSpaceApiRepository extends ApiRepository {
  final SharedSpacesApi _api;
  final TimelineApi _timelineApi;

  SharedSpaceApiRepository(this._api, this._timelineApi);
```

Add the asset fetching method:

```dart
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';

/// Fetches all assets in a space via the timeline API.
/// Returns RemoteAsset objects suitable for TimelineFactory.fromAssetsWithBuckets().
Future<List<RemoteAsset>> getSpaceAssets(String spaceId) async {
  // 1. Get time buckets for the space
  final buckets = await _timelineApi.getTimeBuckets(spaceId: spaceId);
  if (buckets == null || buckets.isEmpty) return [];

  // 2. Fetch assets for each bucket
  final allAssets = <RemoteAsset>[];
  for (final bucket in buckets) {
    final bucketData = await _timelineApi.getTimeBucket(
      bucket.timeBucket,
      spaceId: spaceId,
    );
    if (bucketData == null) continue;

    // 3. Convert columnar TimeBucketAssetResponseDto to RemoteAsset list
    for (int i = 0; i < bucketData.id.length; i++) {
      allAssets.add(RemoteAsset(
        id: bucketData.id[i],
        name: bucketData.id[i], // name not in bucket response, use id as fallback
        ownerId: bucketData.ownerId[i],
        checksum: '', // not in bucket response, not needed for grid display
        type: bucketData.isImage[i] ? AssetType.image : AssetType.video,
        createdAt: bucketData.fileCreatedAt[i],
        updatedAt: bucketData.fileCreatedAt[i],
        isFavorite: bucketData.isFavorite[i],
        thumbHash: bucketData.thumbhash[i],
        livePhotoVideoId: bucketData.livePhotoVideoId[i],
        isEdited: false,
        width: bucketData.ratio[i] != null ? (bucketData.ratio[i]! * 100).round() : null,
        height: bucketData.ratio[i] != null ? 100 : null,
        durationInSeconds: _parseDuration(bucketData.duration[i]),
      ));
    }
  }

  return allAssets;
}

int? _parseDuration(String? duration) {
  if (duration == null || duration == '0:00:00.00000') return null;
  final parts = duration.split(':');
  if (parts.length != 3) return null;
  final hours = int.tryParse(parts[0]) ?? 0;
  final minutes = int.tryParse(parts[1]) ?? 0;
  final secondParts = parts[2].split('.');
  final seconds = int.tryParse(secondParts[0]) ?? 0;
  return hours * 3600 + minutes * 60 + seconds;
}
```

**Step 2: Update the provider to pass TimelineApi**

Modify `mobile/lib/providers/shared_space.provider.dart` — update `sharedSpaceApiRepositoryProvider`:

Find the existing provider and update it. Also need to check `mobile/lib/repositories/shared_space_api.repository.dart` for the provider definition. The provider is actually in the repository file:

```dart
final sharedSpaceApiRepositoryProvider = Provider(
  (ref) => SharedSpaceApiRepository(
    ref.watch(apiServiceProvider).sharedSpacesApi,
    ref.watch(apiServiceProvider).timelineApi,
  ),
);
```

**Step 3: Commit**

```bash
git add mobile/lib/repositories/shared_space_api.repository.dart
git commit -m "feat(mobile): add space asset fetching via timeline API"
```

---

## Task 4: Provider Layer — Current Member and Role Helpers

**Files:**

- Modify: `mobile/lib/providers/shared_space.provider.dart`

**Step 1: Add currentSpaceMemberProvider**

```dart
import 'package:immich_mobile/providers/user.provider.dart';

/// Derives the current user's membership in a space.
/// Returns null if the user is not a member.
final currentSpaceMemberProvider = FutureProvider.family<SharedSpaceMemberResponseDto?, String>((
  ref,
  spaceId,
) async {
  final members = await ref.watch(sharedSpaceMembersProvider(spaceId).future);
  final currentUser = ref.watch(currentUserProvider);
  if (currentUser == null) return null;
  return members.where((m) => m.userId == currentUser.id).firstOrNull;
});
```

**Step 2: Add spaceAssetsProvider**

```dart
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/repositories/shared_space_api.repository.dart';

final spaceAssetsProvider = FutureProvider.family<List<RemoteAsset>, String>((ref, spaceId) async {
  final repository = ref.watch(sharedSpaceApiRepositoryProvider);
  return repository.getSpaceAssets(spaceId);
});
```

**Step 3: Commit**

```bash
git add mobile/lib/providers/shared_space.provider.dart
git commit -m "feat(mobile): add currentSpaceMember and spaceAssets providers"
```

---

## Task 5: Add TimelineOrigin.remoteSpace

**Files:**

- Modify: `mobile/lib/domain/services/timeline.service.dart`

**Step 1: Add remoteSpace to TimelineOrigin enum**

Add `remoteSpace` to the `TimelineOrigin` enum (after `albumActivities`):

```dart
enum TimelineOrigin {
  main,
  localAlbum,
  remoteAlbum,
  remoteAssets,
  favorite,
  trash,
  archive,
  lockedFolder,
  video,
  place,
  person,
  map,
  search,
  deepLink,
  albumActivities,
  remoteSpace,      // <-- add this
}
```

**Step 2: Commit**

```bash
git add mobile/lib/domain/services/timeline.service.dart
git commit -m "feat(mobile): add TimelineOrigin.remoteSpace"
```

---

## Task 6: Action Service — Remove From Space

Follow the `removeFromAlbum` pattern in the action service to add `removeFromSpace`.

**Files:**

- Modify: `mobile/lib/services/action.service.dart`
- Modify: `mobile/lib/providers/infrastructure/action.provider.dart`

**Step 1: Add removeFromSpace to ActionService**

In `mobile/lib/services/action.service.dart`, add:

```dart
Future<int> removeFromSpace(List<String> remoteIds, String spaceId) async {
  await _sharedSpaceApiRepository.removeAssets(spaceId, remoteIds);
  return remoteIds.length;
}
```

The `ActionService` constructor needs the space repository injected. Check the constructor and add:

```dart
final SharedSpaceApiRepository _sharedSpaceApiRepository;
```

And wire it in the constructor. Also update the provider in the provider file to pass it.

**Step 2: Add removeFromSpace to ActionNotifier**

In `mobile/lib/providers/infrastructure/action.provider.dart`, add to the `ActionNotifier` class (near `removeFromAlbum`):

```dart
Future<ActionResult> removeFromSpace(ActionSource source, String spaceId) async {
  final ids = _getRemoteIdsForSource(source);
  try {
    final removedCount = await _service.removeFromSpace(ids, spaceId);
    return ActionResult(count: removedCount, success: true);
  } catch (error, stack) {
    _logger.severe('Failed to remove assets from space', error, stack);
    return ActionResult(count: ids.length, success: false, error: error.toString());
  }
}
```

**Step 3: Commit**

```bash
git add mobile/lib/services/action.service.dart mobile/lib/providers/infrastructure/action.provider.dart
git commit -m "feat(mobile): add removeFromSpace action"
```

---

## Task 7: RemoveFromSpaceActionButton Widget

Follow the `RemoveFromAlbumActionButton` pattern exactly.

**Files:**

- Create: `mobile/lib/presentation/widgets/action_buttons/remove_from_space_action_button.widget.dart`

**Step 1: Create the widget**

```dart
import 'package:flutter/material.dart';
import 'package:fluttertoast/fluttertoast.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/constants/enums.dart';
import 'package:immich_mobile/extensions/translate_extensions.dart';
import 'package:immich_mobile/presentation/widgets/action_buttons/base_action_button.widget.dart';
import 'package:immich_mobile/providers/infrastructure/action.provider.dart';
import 'package:immich_mobile/providers/timeline/multiselect.provider.dart';
import 'package:immich_mobile/widgets/common/immich_toast.dart';

class RemoveFromSpaceActionButton extends ConsumerWidget {
  final String spaceId;
  final ActionSource source;
  final VoidCallback? onComplete;

  const RemoveFromSpaceActionButton({
    super.key,
    required this.spaceId,
    required this.source,
    this.onComplete,
  });

  void _onTap(BuildContext context, WidgetRef ref) async {
    if (!context.mounted) return;

    final result = await ref.read(actionProvider.notifier).removeFromSpace(source, spaceId);
    ref.read(multiSelectProvider.notifier).reset();
    onComplete?.call();

    if (context.mounted) {
      ImmichToast.show(
        context: context,
        msg: result.success
            ? '${result.count} photos removed from space'
            : 'scaffold_body_error_occurred'.t(context: context),
        gravity: ToastGravity.BOTTOM,
        toastType: result.success ? ToastType.success : ToastType.error,
      );
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return BaseActionButton(
      iconData: Icons.remove_circle_outline,
      label: 'Remove from space',
      onPressed: () => _onTap(context, ref),
      maxWidth: 100,
    );
  }
}
```

**Step 2: Commit**

```bash
git add mobile/lib/presentation/widgets/action_buttons/remove_from_space_action_button.widget.dart
git commit -m "feat(mobile): add RemoveFromSpaceActionButton"
```

---

## Task 8: SpaceBottomSheet Widget

Create a bottom sheet for multi-select actions within a space, following `RemoteAlbumBottomSheet`.

**Files:**

- Create: `mobile/lib/presentation/widgets/bottom_sheet/space_bottom_sheet.widget.dart`

**Step 1: Create the widget**

```dart
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/constants/enums.dart';
import 'package:immich_mobile/presentation/widgets/action_buttons/download_action_button.widget.dart';
import 'package:immich_mobile/presentation/widgets/action_buttons/favorite_action_button.widget.dart';
import 'package:immich_mobile/presentation/widgets/action_buttons/remove_from_space_action_button.widget.dart';
import 'package:immich_mobile/presentation/widgets/action_buttons/share_action_button.widget.dart';
import 'package:immich_mobile/presentation/widgets/bottom_sheet/base_bottom_sheet.widget.dart';
import 'package:immich_mobile/providers/timeline/multiselect.provider.dart';
import 'package:openapi/api.dart';

class SpaceBottomSheet extends ConsumerStatefulWidget {
  final String spaceId;
  final SharedSpaceRole currentUserRole;
  final VoidCallback? onAssetsRemoved;

  const SpaceBottomSheet({
    super.key,
    required this.spaceId,
    required this.currentUserRole,
    this.onAssetsRemoved,
  });

  @override
  ConsumerState<SpaceBottomSheet> createState() => _SpaceBottomSheetState();
}

class _SpaceBottomSheetState extends ConsumerState<SpaceBottomSheet> {
  late DraggableScrollableController sheetController;

  @override
  void initState() {
    super.initState();
    sheetController = DraggableScrollableController();
  }

  @override
  void dispose() {
    sheetController.dispose();
    super.dispose();
  }

  bool get _canEdit =>
      widget.currentUserRole == SharedSpaceRole.owner ||
      widget.currentUserRole == SharedSpaceRole.editor;

  @override
  Widget build(BuildContext context) {
    final multiselect = ref.watch(multiSelectProvider);

    return BaseBottomSheet(
      controller: sheetController,
      initialChildSize: 0.22,
      minChildSize: 0.22,
      maxChildSize: 0.55,
      shouldCloseOnMinExtent: false,
      actions: [
        const ShareActionButton(source: ActionSource.timeline),
        if (multiselect.hasRemote) ...[
          const DownloadActionButton(source: ActionSource.timeline),
          const FavoriteActionButton(source: ActionSource.timeline),
          if (_canEdit)
            RemoveFromSpaceActionButton(
              source: ActionSource.timeline,
              spaceId: widget.spaceId,
              onComplete: widget.onAssetsRemoved,
            ),
        ],
      ],
    );
  }
}
```

**Step 2: Commit**

```bash
git add mobile/lib/presentation/widgets/bottom_sheet/space_bottom_sheet.widget.dart
git commit -m "feat(mobile): add SpaceBottomSheet for multi-select actions"
```

---

## Task 9: Space Detail Page — Full Rewrite with Timeline

This is the biggest task. Rewrite `space_detail.page.dart` to use the `Timeline` widget with photo grid, following the `drift_remote_album.page.dart` pattern.

**Files:**

- Rewrite: `mobile/lib/pages/library/spaces/space_detail.page.dart`

**Step 1: Rewrite the page**

```dart
import 'dart:async';

import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/domain/services/timeline.service.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/presentation/widgets/bottom_sheet/space_bottom_sheet.widget.dart';
import 'package:immich_mobile/presentation/widgets/timeline/timeline.widget.dart';
import 'package:immich_mobile/providers/infrastructure/timeline.provider.dart';
import 'package:immich_mobile/providers/shared_space.provider.dart';
import 'package:immich_mobile/providers/user.provider.dart';
import 'package:immich_mobile/repositories/shared_space_api.repository.dart';
import 'package:immich_mobile/routing/router.dart';
import 'package:immich_mobile/widgets/common/immich_toast.dart';
import 'package:openapi/api.dart';

@RoutePage()
class SpaceDetailPage extends ConsumerStatefulWidget {
  final String spaceId;

  const SpaceDetailPage({super.key, required this.spaceId});

  @override
  ConsumerState<SpaceDetailPage> createState() => _SpaceDetailPageState();
}

class _SpaceDetailPageState extends ConsumerState<SpaceDetailPage> {
  SharedSpaceResponseDto? _space;
  SharedSpaceMemberResponseDto? _currentMember;
  List<RemoteAsset>? _assets;
  String? _error;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    try {
      final repo = ref.read(sharedSpaceApiRepositoryProvider);
      final results = await Future.wait([
        repo.get(widget.spaceId),
        repo.getMembers(widget.spaceId),
        repo.getSpaceAssets(widget.spaceId),
      ]);

      final space = results[0] as SharedSpaceResponseDto;
      final members = results[1] as List<SharedSpaceMemberResponseDto>;
      final assets = results[2] as List<RemoteAsset>;
      final currentUser = ref.read(currentUserProvider);
      final currentMember = members.where((m) => m.userId == currentUser?.id).firstOrNull;

      if (mounted) {
        setState(() {
          _space = space;
          _currentMember = currentMember;
          _assets = assets;
          _loading = false;
        });
      }
    } catch (e) {
      if (mounted) setState(() { _error = e.toString(); _loading = false; });
    }
  }

  Future<void> _refreshAssets() async {
    final repo = ref.read(sharedSpaceApiRepositoryProvider);
    final assets = await repo.getSpaceAssets(widget.spaceId);
    final space = await repo.get(widget.spaceId);
    if (mounted) setState(() { _assets = assets; _space = space; });
  }

  bool get _isOwner => _currentMember?.role == SharedSpaceRole.owner;
  bool get _canEdit =>
      _currentMember?.role == SharedSpaceRole.owner ||
      _currentMember?.role == SharedSpaceRole.editor;

  Future<void> _addPhotos() async {
    final newAssets = await context.pushRoute<Set<BaseAsset>>(
      DriftAssetSelectionTimelineRoute(),
    );

    if (newAssets == null || newAssets.isEmpty) return;

    try {
      final assetIds = newAssets.map((a) => (a as RemoteAsset).id).toList();
      await ref.read(sharedSpaceApiRepositoryProvider).addAssets(widget.spaceId, assetIds);
      ImmichToast.show(
        context: context,
        msg: 'Added ${assetIds.length} photos to space',
        toastType: ToastType.success,
      );
      await _refreshAssets();
    } catch (e) {
      if (context.mounted) {
        ImmichToast.show(context: context, msg: 'Failed to add photos', toastType: ToastType.error);
      }
    }
  }

  Future<void> _deleteSpace() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete Space'),
        content: Text('Are you sure you want to delete "${_space?.name}"? This cannot be undone.'),
        actions: [
          TextButton(onPressed: () => Navigator.of(context).pop(false), child: const Text('Cancel')),
          TextButton(
            onPressed: () => Navigator.of(context).pop(true),
            style: TextButton.styleFrom(foregroundColor: Theme.of(context).colorScheme.error),
            child: const Text('Delete'),
          ),
        ],
      ),
    );

    if (confirmed == true) {
      try {
        await ref.read(sharedSpaceApiRepositoryProvider).delete(widget.spaceId);
        ref.invalidate(sharedSpacesProvider);
        if (context.mounted) {
          ImmichToast.show(context: context, msg: 'Space deleted', toastType: ToastType.success);
          context.maybePop();
        }
      } catch (e) {
        if (context.mounted) {
          ImmichToast.show(context: context, msg: 'Failed to delete space', toastType: ToastType.error);
        }
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return Scaffold(
        appBar: AppBar(title: const Text('Space')),
        body: const Center(child: CircularProgressIndicator()),
      );
    }

    if (_error != null || _space == null) {
      return Scaffold(
        appBar: AppBar(title: const Text('Space')),
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.error_outline, size: 48),
              const SizedBox(height: 16),
              Text('Failed to load space: ${_error ?? "Unknown error"}'),
              const SizedBox(height: 16),
              ElevatedButton(
                onPressed: () { setState(() { _loading = true; _error = null; }); _loadData(); },
                child: const Text('Retry'),
              ),
            ],
          ),
        ),
      );
    }

    final assets = _assets ?? [];

    if (assets.isEmpty) {
      return _buildEmptyState();
    }

    return ProviderScope(
      overrides: [
        timelineServiceProvider.overrideWith((ref) {
          final timelineService = ref.watch(timelineFactoryProvider)
              .fromAssetsWithBuckets(assets, TimelineOrigin.remoteSpace);
          ref.onDispose(timelineService.dispose);
          return timelineService;
        }),
      ],
      child: Timeline(
        appBar: _SpaceAppBar(
          space: _space!,
          isOwner: _isOwner,
          canEdit: _canEdit,
          onAddPhotos: _addPhotos,
          onMembers: () => context.pushRoute(SpaceMembersRoute(spaceId: widget.spaceId)).then((_) => _loadData()),
          onDelete: _isOwner ? _deleteSpace : null,
        ),
        bottomSheet: SpaceBottomSheet(
          spaceId: widget.spaceId,
          currentUserRole: _currentMember?.role ?? SharedSpaceRole.viewer,
          onAssetsRemoved: _refreshAssets,
        ),
      ),
    );
  }

  Widget _buildEmptyState() {
    return Scaffold(
      appBar: AppBar(
        title: Text(_space!.name),
        centerTitle: false,
        actions: [
          IconButton(
            icon: const Icon(Icons.people_outline),
            onPressed: () => context.pushRoute(SpaceMembersRoute(spaceId: widget.spaceId)).then((_) => _loadData()),
          ),
          if (_isOwner)
            PopupMenuButton<String>(
              onSelected: (value) { if (value == 'delete') _deleteSpace(); },
              itemBuilder: (context) => [
                const PopupMenuItem(value: 'delete', child: Text('Delete Space')),
              ],
            ),
        ],
      ),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.photo_library_outlined, size: 64, color: context.colorScheme.onSurface.withAlpha(100)),
            const SizedBox(height: 16),
            Text('No photos yet', style: context.textTheme.titleMedium?.copyWith(
              color: context.colorScheme.onSurface.withAlpha(150),
            )),
            if (_canEdit) ...[
              const SizedBox(height: 24),
              ElevatedButton.icon(
                onPressed: _addPhotos,
                icon: const Icon(Icons.add_photo_alternate_outlined),
                label: const Text('Add Photos'),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

class _SpaceAppBar extends ConsumerWidget implements PreferredSizeWidget {
  final SharedSpaceResponseDto space;
  final bool isOwner;
  final bool canEdit;
  final VoidCallback onAddPhotos;
  final VoidCallback onMembers;
  final VoidCallback? onDelete;

  const _SpaceAppBar({
    required this.space,
    required this.isOwner,
    required this.canEdit,
    required this.onAddPhotos,
    required this.onMembers,
    this.onDelete,
  });

  @override
  Size get preferredSize => const Size.fromHeight(kToolbarHeight);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return SliverAppBar(
      title: Text(space.name),
      centerTitle: false,
      floating: true,
      pinned: false,
      snap: false,
      actions: [
        if (canEdit)
          IconButton(
            icon: const Icon(Icons.add_photo_alternate_outlined),
            onPressed: onAddPhotos,
            tooltip: 'Add Photos',
          ),
        IconButton(
          icon: const Icon(Icons.people_outline),
          onPressed: onMembers,
          tooltip: 'Members',
        ),
        if (isOwner)
          PopupMenuButton<String>(
            onSelected: (value) { if (value == 'delete') onDelete?.call(); },
            itemBuilder: (context) => [
              const PopupMenuItem(value: 'delete', child: Text('Delete Space')),
            ],
          ),
      ],
    );
  }
}
```

**Step 2: Commit**

```bash
git add mobile/lib/pages/library/spaces/space_detail.page.dart
git commit -m "feat(mobile): rewrite space detail page with Timeline grid and role-based UI"
```

---

## Task 10: Space Members Page

Create a dedicated page for viewing and managing space members.

**Files:**

- Create: `mobile/lib/pages/library/spaces/space_members.page.dart`

**Step 1: Create the page**

```dart
import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/providers/shared_space.provider.dart';
import 'package:immich_mobile/providers/user.provider.dart';
import 'package:immich_mobile/repositories/shared_space_api.repository.dart';
import 'package:immich_mobile/routing/router.dart';
import 'package:immich_mobile/widgets/common/immich_toast.dart';
import 'package:immich_mobile/widgets/common/user_circle_avatar.dart';
import 'package:openapi/api.dart';

@RoutePage()
class SpaceMembersPage extends HookConsumerWidget {
  final String spaceId;

  const SpaceMembersPage({super.key, required this.spaceId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final membersAsync = ref.watch(sharedSpaceMembersProvider(spaceId));
    final currentUser = ref.watch(currentUserProvider);

    SharedSpaceMemberResponseDto? getCurrentMember(List<SharedSpaceMemberResponseDto> members) {
      return members.where((m) => m.userId == currentUser?.id).firstOrNull;
    }

    Future<void> removeMember(SharedSpaceMemberResponseDto member) async {
      final confirmed = await showDialog<bool>(
        context: context,
        builder: (ctx) => AlertDialog(
          title: Text(member.userId == currentUser?.id ? 'Leave Space' : 'Remove Member'),
          content: Text(member.userId == currentUser?.id
              ? 'Are you sure you want to leave this space?'
              : 'Remove ${member.name} from this space?'),
          actions: [
            TextButton(onPressed: () => Navigator.of(ctx).pop(false), child: const Text('Cancel')),
            TextButton(
              onPressed: () => Navigator.of(ctx).pop(true),
              style: TextButton.styleFrom(foregroundColor: Theme.of(ctx).colorScheme.error),
              child: Text(member.userId == currentUser?.id ? 'Leave' : 'Remove'),
            ),
          ],
        ),
      );

      if (confirmed == true) {
        try {
          await ref.read(sharedSpaceApiRepositoryProvider).removeMember(spaceId, member.userId);
          ref.invalidate(sharedSpaceMembersProvider(spaceId));
          if (member.userId == currentUser?.id && context.mounted) {
            ref.invalidate(sharedSpacesProvider);
            context.maybePop();
          } else if (context.mounted) {
            ImmichToast.show(context: context, msg: '${member.name} removed', toastType: ToastType.success);
          }
        } catch (e) {
          if (context.mounted) {
            ImmichToast.show(context: context, msg: 'Failed to remove member', toastType: ToastType.error);
          }
        }
      }
    }

    Future<void> updateRole(SharedSpaceMemberResponseDto member, SharedSpaceRole newRole) async {
      try {
        await ref.read(sharedSpaceApiRepositoryProvider).updateMember(spaceId, member.userId, newRole);
        ref.invalidate(sharedSpaceMembersProvider(spaceId));
        if (context.mounted) {
          ImmichToast.show(
            context: context,
            msg: '${member.name} is now ${newRole.value}',
            toastType: ToastType.success,
          );
        }
      } catch (e) {
        if (context.mounted) {
          ImmichToast.show(context: context, msg: 'Failed to update role', toastType: ToastType.error);
        }
      }
    }

    void showMemberActions(SharedSpaceMemberResponseDto member, bool isOwner) {
      showModalBottomSheet(
        context: context,
        builder: (ctx) => SafeArea(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Padding(
                padding: const EdgeInsets.all(16),
                child: Text(member.name, style: context.textTheme.titleMedium),
              ),
              if (isOwner && member.role != SharedSpaceRole.owner) ...[
                ListTile(
                  leading: const Icon(Icons.edit_outlined),
                  title: const Text('Set as Editor'),
                  trailing: member.role == SharedSpaceRole.editor ? const Icon(Icons.check) : null,
                  onTap: () {
                    Navigator.of(ctx).pop();
                    updateRole(member, SharedSpaceRole.editor);
                  },
                ),
                ListTile(
                  leading: const Icon(Icons.visibility_outlined),
                  title: const Text('Set as Viewer'),
                  trailing: member.role == SharedSpaceRole.viewer ? const Icon(Icons.check) : null,
                  onTap: () {
                    Navigator.of(ctx).pop();
                    updateRole(member, SharedSpaceRole.viewer);
                  },
                ),
                const Divider(),
                ListTile(
                  leading: Icon(Icons.person_remove_outlined, color: Theme.of(ctx).colorScheme.error),
                  title: Text('Remove from Space', style: TextStyle(color: Theme.of(ctx).colorScheme.error)),
                  onTap: () {
                    Navigator.of(ctx).pop();
                    removeMember(member);
                  },
                ),
              ],
              if (!isOwner && member.userId == currentUser?.id)
                ListTile(
                  leading: Icon(Icons.exit_to_app, color: Theme.of(ctx).colorScheme.error),
                  title: Text('Leave Space', style: TextStyle(color: Theme.of(ctx).colorScheme.error)),
                  onTap: () {
                    Navigator.of(ctx).pop();
                    removeMember(member);
                  },
                ),
            ],
          ),
        ),
      );
    }

    return Scaffold(
      appBar: AppBar(
        title: const Text('Members'),
        centerTitle: false,
        actions: [
          membersAsync.when(
            data: (members) {
              final currentMember = getCurrentMember(members);
              if (currentMember?.role == SharedSpaceRole.owner) {
                return IconButton(
                  icon: const Icon(Icons.person_add_outlined),
                  onPressed: () async {
                    final existingIds = members.map((m) => m.userId).toList();
                    await context.pushRoute(
                      SpaceMemberSelectionRoute(spaceId: spaceId, existingMemberIds: existingIds),
                    );
                    ref.invalidate(sharedSpaceMembersProvider(spaceId));
                  },
                  tooltip: 'Add Member',
                );
              }
              return const SizedBox.shrink();
            },
            loading: () => const SizedBox.shrink(),
            error: (_, __) => const SizedBox.shrink(),
          ),
        ],
      ),
      body: membersAsync.when(
        data: (members) {
          final currentMember = getCurrentMember(members);
          final isOwner = currentMember?.role == SharedSpaceRole.owner;

          return ListView.builder(
            itemCount: members.length,
            itemBuilder: (context, index) {
              final member = members[index];
              return ListTile(
                leading: CircleAvatar(
                  child: Text(member.name.isNotEmpty ? member.name[0].toUpperCase() : '?'),
                ),
                title: Text(member.name),
                subtitle: Text(member.email),
                trailing: Chip(
                  label: Text(member.role.value, style: context.textTheme.labelSmall),
                  padding: EdgeInsets.zero,
                  visualDensity: VisualDensity.compact,
                ),
                onTap: (isOwner && member.role != SharedSpaceRole.owner) ||
                        (!isOwner && member.userId == currentUser?.id)
                    ? () => showMemberActions(member, isOwner)
                    : null,
              );
            },
          );
        },
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, _) => Center(child: Text('Failed to load members: $error')),
      ),
    );
  }
}
```

**Step 2: Commit**

```bash
git add mobile/lib/pages/library/spaces/space_members.page.dart
git commit -m "feat(mobile): add SpaceMembersPage with role editing and remove"
```

---

## Task 11: Space Member Selection Page

Create a user picker for adding members to a space, following `AlbumAdditionalSharedUserSelectionPage`.

**Files:**

- Create: `mobile/lib/pages/library/spaces/space_member_selection.page.dart`

**Step 1: Create the page**

```dart
import 'package:auto_route/auto_route.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/user.model.dart';
import 'package:immich_mobile/extensions/asyncvalue_extensions.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/providers/album/suggested_shared_users.provider.dart';
import 'package:immich_mobile/repositories/shared_space_api.repository.dart';
import 'package:immich_mobile/widgets/common/immich_toast.dart';
import 'package:immich_mobile/widgets/common/user_circle_avatar.dart';

@RoutePage()
class SpaceMemberSelectionPage extends HookConsumerWidget {
  final String spaceId;
  final List<String> existingMemberIds;

  const SpaceMemberSelectionPage({
    super.key,
    required this.spaceId,
    required this.existingMemberIds,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final suggestedUsers = ref.watch(otherUsersProvider);
    final selectedUsers = useState<Set<UserDto>>({});

    Future<void> addSelectedMembers() async {
      try {
        final repo = ref.read(sharedSpaceApiRepositoryProvider);
        for (final user in selectedUsers.value) {
          await repo.addMember(spaceId, user.id);
        }
        if (context.mounted) {
          ImmichToast.show(
            context: context,
            msg: 'Added ${selectedUsers.value.length} members',
            toastType: ToastType.success,
          );
          context.maybePop();
        }
      } catch (e) {
        if (context.mounted) {
          ImmichToast.show(context: context, msg: 'Failed to add members', toastType: ToastType.error);
        }
      }
    }

    Widget buildTileIcon(UserDto user) {
      if (selectedUsers.value.contains(user)) {
        return CircleAvatar(
          backgroundColor: context.primaryColor,
          child: const Icon(Icons.check_rounded, size: 25),
        );
      }
      return UserCircleAvatar(user: user);
    }

    return Scaffold(
      appBar: AppBar(
        title: const Text('Add Members'),
        centerTitle: false,
        leading: IconButton(
          icon: const Icon(Icons.close_rounded),
          onPressed: () => context.maybePop(),
        ),
        actions: [
          TextButton(
            onPressed: selectedUsers.value.isEmpty ? null : addSelectedMembers,
            child: Text(
              'add'.tr(),
              style: TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.bold,
                color: selectedUsers.value.isEmpty ? null : context.primaryColor,
              ),
            ),
          ),
        ],
      ),
      body: suggestedUsers.widgetWhen(
        onData: (users) {
          // Filter out users who are already members
          users.removeWhere((u) => existingMemberIds.contains(u.id));

          if (users.isEmpty) {
            return const Center(child: Text('No users available to add'));
          }

          return ListView(
            children: [
              if (selectedUsers.value.isNotEmpty)
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 8.0),
                  child: Wrap(
                    children: selectedUsers.value.map((user) => Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 4.0),
                      child: Chip(
                        backgroundColor: context.primaryColor.withValues(alpha: 0.15),
                        label: Text(user.name, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                      ),
                    )).toList(),
                  ),
                ),
              Padding(
                padding: const EdgeInsets.all(16.0),
                child: Text(
                  'suggestions'.tr(),
                  style: const TextStyle(fontSize: 14, color: Colors.grey, fontWeight: FontWeight.bold),
                ),
              ),
              ListView.builder(
                primary: false,
                shrinkWrap: true,
                itemCount: users.length,
                itemBuilder: (context, index) {
                  final user = users[index];
                  return ListTile(
                    leading: buildTileIcon(user),
                    dense: true,
                    title: Text(user.name, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold)),
                    subtitle: Text(user.email, style: const TextStyle(fontSize: 12)),
                    onTap: () {
                      if (selectedUsers.value.contains(user)) {
                        selectedUsers.value = selectedUsers.value.where((u) => u.id != user.id).toSet();
                      } else {
                        selectedUsers.value = {...selectedUsers.value, user};
                      }
                    },
                  );
                },
              ),
            ],
          );
        },
      ),
    );
  }
}
```

**Step 2: Commit**

```bash
git add mobile/lib/pages/library/spaces/space_member_selection.page.dart
git commit -m "feat(mobile): add SpaceMemberSelectionPage for adding members"
```

---

## Task 12: Routing — Add New Routes

Register the new pages with auto_route and run code generation.

**Files:**

- Modify: `mobile/lib/routing/router.dart`

**Step 1: Add imports and route definitions**

Add imports at the top of `router.dart`:

```dart
import 'package:immich_mobile/pages/library/spaces/space_members.page.dart';
import 'package:immich_mobile/pages/library/spaces/space_member_selection.page.dart';
```

Add routes in the `routes` list (near the existing `SpaceDetailRoute`):

```dart
AutoRoute(page: SpaceMembersRoute.page, guards: [_authGuard, _duplicateGuard]),
CustomRoute(
  page: SpaceMemberSelectionRoute.page,
  guards: [_authGuard, _duplicateGuard],
  transitionsBuilder: TransitionsBuilders.slideBottom,
),
```

**Step 2: Run auto_route code generation**

```bash
cd mobile && dart run build_runner build --delete-conflicting-outputs
```

This generates `router.gr.dart` with `SpaceMembersRoute` and `SpaceMemberSelectionRoute` classes.

**Step 3: Verify compilation**

```bash
cd mobile && flutter analyze
```

**Step 4: Commit**

```bash
git add mobile/lib/routing/router.dart mobile/lib/routing/router.gr.dart
git commit -m "feat(mobile): add space members and member selection routes"
```

---

## Task 13: Spaces List Page — Show Asset Count

Minor enhancement to show asset count in the space list.

**Files:**

- Modify: `mobile/lib/pages/library/spaces/spaces.page.dart`

**Step 1: Add asset count to trailing**

In the `ListTile` trailing `Row`, add asset count before member count:

```dart
trailing: Row(
  mainAxisSize: MainAxisSize.min,
  children: [
    if (space.assetCount != null)
      Padding(
        padding: const EdgeInsets.only(right: 8.0),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.photo_outlined, size: 16, color: context.colorScheme.onSurface.withAlpha(150)),
            const SizedBox(width: 2),
            Text('${space.assetCount!.toInt()}', style: context.textTheme.bodySmall),
          ],
        ),
      ),
    if (space.memberCount != null)
      Padding(
        padding: const EdgeInsets.only(right: 4.0),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.people_outline, size: 16, color: context.colorScheme.onSurface.withAlpha(150)),
            const SizedBox(width: 2),
            Text('${space.memberCount!.toInt()}', style: context.textTheme.bodySmall),
          ],
        ),
      ),
    const Icon(Icons.chevron_right),
  ],
),
```

**Step 2: Commit**

```bash
git add mobile/lib/pages/library/spaces/spaces.page.dart
git commit -m "feat(mobile): show asset count in spaces list"
```

---

## Task 14: Wire Up ActionService Dependencies

The `ActionService` needs the `SharedSpaceApiRepository` injected. Wire it up properly.

**Files:**

- Modify: `mobile/lib/services/action.service.dart` (add constructor parameter)
- Modify: provider file that creates `ActionService` (find via grep for `actionServiceProvider` or `ActionService(`)

**Step 1: Find and update the ActionService constructor**

Search for the `ActionService` constructor. Add `SharedSpaceApiRepository` as a dependency:

```dart
final SharedSpaceApiRepository _sharedSpaceApiRepository;
```

Add to the constructor parameter list.

**Step 2: Update the provider**

Find the provider that creates `ActionService` and add:

```dart
ref.watch(sharedSpaceApiRepositoryProvider),
```

to the constructor call.

**Step 3: Commit**

```bash
git add mobile/lib/services/action.service.dart mobile/lib/providers/infrastructure/action.provider.dart
git commit -m "feat(mobile): wire SharedSpaceApiRepository into ActionService"
```

---

## Task 15: Integration Verification

**Step 1: Run static analysis**

```bash
cd mobile && flutter analyze
```

Fix any import issues, type errors, or unused import warnings.

**Step 2: Run code generation if needed**

```bash
cd mobile && dart run build_runner build --delete-conflicting-outputs
```

**Step 3: Verify the app builds**

```bash
cd mobile && flutter build ios --no-codesign --debug
```

If this fails, fix issues and re-run.

**Step 4: Final commit**

```bash
git add -A
git commit -m "fix(mobile): resolve compilation issues for shared spaces"
```

---

## Summary of Files

### New Files

| File                                                                              | Purpose                                     |
| --------------------------------------------------------------------------------- | ------------------------------------------- |
| `pages/library/spaces/space_members.page.dart`                                    | Member management (view, edit role, remove) |
| `pages/library/spaces/space_member_selection.page.dart`                           | User picker for adding members              |
| `presentation/widgets/action_buttons/remove_from_space_action_button.widget.dart` | Multi-select remove action                  |
| `presentation/widgets/bottom_sheet/space_bottom_sheet.widget.dart`                | Multi-select action bar                     |

### Modified Files

| File                                            | Changes                                                   |
| ----------------------------------------------- | --------------------------------------------------------- |
| `repositories/shared_space_api.repository.dart` | Add updateMember, addAssets, removeAssets, getSpaceAssets |
| `providers/shared_space.provider.dart`          | Add currentSpaceMember, spaceAssets providers             |
| `services/api.service.dart`                     | Initialize TimelineApi                                    |
| `services/action.service.dart`                  | Add removeFromSpace method                                |
| `providers/infrastructure/action.provider.dart` | Add removeFromSpace to notifier                           |
| `domain/services/timeline.service.dart`         | Add TimelineOrigin.remoteSpace                            |
| `pages/library/spaces/space_detail.page.dart`   | Full rewrite with Timeline grid                           |
| `pages/library/spaces/spaces.page.dart`         | Add asset count display                                   |
| `routing/router.dart`                           | Add new routes                                            |

### Generated Files (auto-updated)

| File                     | Trigger                    |
| ------------------------ | -------------------------- |
| `routing/router.gr.dart` | auto_route code generation |
