# Mobile: Promote Spaces to Bottom Nav — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the Albums tab in the mobile bottom nav with Spaces, move Albums into Library, and redesign the Spaces page with rich visual cards matching the web.

**Architecture:** The mobile app has two parallel tab systems (legacy `TabControllerPage` and newer `TabShellPage`). Both need identical changes to swap index 2 from Albums to Spaces. The `SpacesPage` gets a full visual redesign with a new `SpaceCard` widget featuring collage thumbnails, member avatars, and activity indicators. Library pages gain an Albums collection card and list item.

**Tech Stack:** Flutter/Dart, Riverpod, auto_route, Material 3

---

### Task 1: Update tab constants and enum

**Files:**

- Modify: `mobile/lib/constants/constants.dart:61`
- Modify: `mobile/lib/providers/tab.provider.dart:3`

**Step 1: Rename album tab constant to spaces**

In `mobile/lib/constants/constants.dart`, change line 61:

```dart
// Before:
const int kAlbumTabIndex = 2;
// After:
const int kSpacesTabIndex = 2;
```

**Step 2: Rename TabEnum.albums to TabEnum.spaces**

In `mobile/lib/providers/tab.provider.dart`, change line 3:

```dart
// Before:
enum TabEnum { home, search, albums, library }
// After:
enum TabEnum { home, search, spaces, library }
```

**Step 3: Update all references to old names**

In `mobile/lib/pages/common/tab_shell.page.dart:128`:

```dart
// Before:
if (index == kAlbumTabIndex) {
// After:
if (index == kSpacesTabIndex) {
```

Also update `tab_shell.page.dart:129` — replace the album refresh with a spaces refresh:

```dart
// Before:
if (index == kAlbumTabIndex) {
  ref.read(remoteAlbumProvider.notifier).refresh();
}
// After:
if (index == kSpacesTabIndex) {
  ref.invalidate(sharedSpacesProvider);
}
```

This requires adding the import: `import 'package:immich_mobile/providers/shared_space.provider.dart';`

In `mobile/lib/providers/app_life_cycle.provider.dart:106`:

```dart
// Before:
case TabEnum.albums:
  await _ref.read(albumProvider.notifier).refreshRemoteAlbums();
// After:
case TabEnum.spaces:
  break;
```

**Step 4: Commit**

```bash
cd mobile && git add -A && git commit -m "refactor(mobile): rename album tab constants to spaces"
```

---

### Task 2: Swap Albums route for Spaces route in both tab systems

**Files:**

- Modify: `mobile/lib/pages/common/tab_controller.page.dart:63-93,117`
- Modify: `mobile/lib/pages/common/tab_shell.page.dart:35-59,81`
- Modify: `mobile/lib/routing/router.dart:175-194,252-256`

**Step 1: Update TabControllerPage**

In `mobile/lib/pages/common/tab_controller.page.dart`:

Change the navigation destinations (lines 77-84) — replace the Albums destination:

```dart
// Before:
NavigationDestination(
  label: 'albums'.tr(),
  icon: const Icon(Icons.photo_album_outlined),
  selectedIcon: buildIcon(
    isProcessing: isRefreshingRemoteAlbums,
    icon: Icon(Icons.photo_album_rounded, color: context.primaryColor),
  ),
),
// After:
NavigationDestination(
  label: 'Spaces',
  icon: const Icon(Icons.workspaces_outlined),
  selectedIcon: Icon(Icons.workspaces, color: context.primaryColor),
),
```

Change the routes list (line 117):

```dart
// Before:
routes: [const PhotosRoute(), SearchRoute(), const AlbumsRoute(), const LibraryRoute()],
// After:
routes: [const PhotosRoute(), SearchRoute(), const SpacesRoute(), const LibraryRoute()],
```

Remove the now-unused `isRefreshingRemoteAlbums` watch (line 22) and the `album.provider.dart` import (line 6) if no longer used.

**Step 2: Update TabShellPage**

In `mobile/lib/pages/common/tab_shell.page.dart`:

Change navigation destinations (lines 47-53):

```dart
// Before:
NavigationDestination(
  label: 'albums'.tr(),
  icon: const Icon(Icons.photo_album_outlined),
  selectedIcon: Icon(Icons.photo_album_rounded, color: context.primaryColor),
  enabled: !isReadonlyModeEnabled,
),
// After:
NavigationDestination(
  label: 'Spaces',
  icon: const Icon(Icons.workspaces_outlined),
  selectedIcon: Icon(Icons.workspaces, color: context.primaryColor),
  enabled: !isReadonlyModeEnabled,
),
```

Change routes list (line 81):

```dart
// Before:
routes: const [MainTimelineRoute(), DriftSearchRoute(), DriftAlbumsRoute(), DriftLibraryRoute()],
// After:
routes: const [MainTimelineRoute(), DriftSearchRoute(), SpacesRoute(), DriftLibraryRoute()],
```

**Step 3: Update router — move SpacesRoute into tab children**

In `mobile/lib/routing/router.dart`:

Add SpacesRoute as child of TabControllerRoute (lines 178-183):

```dart
// Before:
children: [
  AutoRoute(page: PhotosRoute.page, guards: [_authGuard, _duplicateGuard]),
  AutoRoute(page: SearchRoute.page, guards: [_authGuard, _duplicateGuard], maintainState: false),
  AutoRoute(page: LibraryRoute.page, guards: [_authGuard, _duplicateGuard]),
  AutoRoute(page: AlbumsRoute.page, guards: [_authGuard, _duplicateGuard]),
],
// After:
children: [
  AutoRoute(page: PhotosRoute.page, guards: [_authGuard, _duplicateGuard]),
  AutoRoute(page: SearchRoute.page, guards: [_authGuard, _duplicateGuard], maintainState: false),
  AutoRoute(page: SpacesRoute.page, guards: [_authGuard, _duplicateGuard]),
  AutoRoute(page: LibraryRoute.page, guards: [_authGuard, _duplicateGuard]),
],
```

Same for TabShellRoute children (lines 188-193):

```dart
// Before:
children: [
  AutoRoute(page: MainTimelineRoute.page, guards: [_authGuard, _duplicateGuard]),
  AutoRoute(page: DriftSearchRoute.page, guards: [_authGuard, _duplicateGuard], maintainState: false),
  AutoRoute(page: DriftLibraryRoute.page, guards: [_authGuard, _duplicateGuard]),
  AutoRoute(page: DriftAlbumsRoute.page, guards: [_authGuard, _duplicateGuard]),
],
// After:
children: [
  AutoRoute(page: MainTimelineRoute.page, guards: [_authGuard, _duplicateGuard]),
  AutoRoute(page: DriftSearchRoute.page, guards: [_authGuard, _duplicateGuard], maintainState: false),
  AutoRoute(page: SpacesRoute.page, guards: [_authGuard, _duplicateGuard]),
  AutoRoute(page: DriftLibraryRoute.page, guards: [_authGuard, _duplicateGuard]),
],
```

Remove the standalone SpacesRoute entry (lines 252-256) since it's now a tab child.

**Step 4: Regenerate auto_route**

```bash
cd mobile && dart run build_runner build --delete-conflicting-outputs
```

**Step 5: Fix navigation references**

Files that navigate to `AlbumsRoute()` after deleting an album need updating — they should now navigate to the Library tab instead since albums lives there now:

In `mobile/lib/widgets/album/album_viewer_appbar.dart:62,110`:

```dart
// Before:
unawaited(context.navigateTo(const TabControllerRoute(children: [AlbumsRoute()])));
// After:
unawaited(context.navigateTo(const TabControllerRoute(children: [LibraryRoute()])));
```

In `mobile/lib/pages/album/album_shared_user_selection.page.dart:35`:

```dart
// Before:
unawaited(context.navigateTo(const TabControllerRoute(children: [AlbumsRoute()])));
// After:
unawaited(context.navigateTo(const TabControllerRoute(children: [LibraryRoute()])));
```

In `mobile/lib/pages/album/album_options.page.dart:56`:

```dart
// Before:
unawaited(context.navigateTo(const TabControllerRoute(children: [AlbumsRoute()])));
// After:
unawaited(context.navigateTo(const TabControllerRoute(children: [LibraryRoute()])));
```

In `mobile/lib/presentation/pages/drift_album_options.page.dart:49`:

```dart
// Before:
unawaited(context.navigateTo(const DriftAlbumsRoute()));
// After:
unawaited(context.navigateTo(const DriftLibraryRoute()));
```

In `mobile/lib/presentation/pages/drift_remote_album.page.dart:144`:

```dart
// Before:
unawaited(context.pushRoute(const DriftAlbumsRoute()));
// After:
unawaited(context.pushRoute(const DriftLibraryRoute()));
```

**Step 6: Commit**

```bash
cd mobile && git add -A && git commit -m "feat(mobile): replace albums tab with spaces in bottom nav"
```

---

### Task 3: Add Albums to Library pages (collection card + quick access)

**Files:**

- Modify: `mobile/lib/pages/library/library.page.dart:74-80,89-149`
- Modify: `mobile/lib/presentation/pages/drift_library.page.dart:125-141,330-403`

**Step 1: Update legacy LibraryPage**

In `mobile/lib/pages/library/library.page.dart`:

Add `AlbumsCollectionCard` to the Wrap (line 77):

```dart
// Before:
const Wrap(
  spacing: 8,
  runSpacing: 8,
  children: [PeopleCollectionCard(), PlacesCollectionCard(), LocalAlbumsCollectionCard()],
),
// After:
const Wrap(
  spacing: 8,
  runSpacing: 8,
  children: [PeopleCollectionCard(), PlacesCollectionCard(), LocalAlbumsCollectionCard(), AlbumsCollectionCard()],
),
```

In QuickAccessButtons, replace the Spaces ListTile (lines 139-143) with Albums:

```dart
// Before:
ListTile(
  leading: const Icon(Icons.workspaces_outlined, size: 26),
  title: Text('Spaces', style: context.textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w500)),
  onTap: () => context.pushRoute(const SpacesRoute()),
),
// After:
ListTile(
  leading: const Icon(Icons.photo_album_outlined, size: 26),
  title: Text('albums'.tr(), style: context.textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w500)),
  onTap: () => context.pushRoute(const AlbumsRoute()),
),
```

Add a new `AlbumsCollectionCard` widget at the bottom of the file (after `PlacesCollectionCard`):

```dart
class AlbumsCollectionCard extends ConsumerWidget {
  const AlbumsCollectionCard({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final albums = ref.watch(albumProvider);

    return LayoutBuilder(
      builder: (context, constraints) {
        final isTablet = constraints.maxWidth > 600;
        final widthFactor = isTablet ? 0.25 : 0.5;
        final size = context.width * widthFactor - 20.0;

        return GestureDetector(
          onTap: () => context.pushRoute(const AlbumsRoute()),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              SizedBox(
                height: size,
                width: size,
                child: DecoratedBox(
                  decoration: BoxDecoration(
                    borderRadius: const BorderRadius.all(Radius.circular(20)),
                    gradient: LinearGradient(
                      colors: [context.colorScheme.primary.withAlpha(30), context.colorScheme.primary.withAlpha(25)],
                      begin: Alignment.topCenter,
                      end: Alignment.bottomCenter,
                    ),
                  ),
                  child: GridView.count(
                    crossAxisCount: 2,
                    padding: const EdgeInsets.all(12),
                    crossAxisSpacing: 8,
                    mainAxisSpacing: 8,
                    physics: const NeverScrollableScrollPhysics(),
                    children: albums.take(4).map((album) {
                      return AlbumThumbnailCard(album: album, showTitle: false);
                    }).toList(),
                  ),
                ),
              ),
              Padding(
                padding: const EdgeInsets.all(8.0),
                child: Text(
                  'albums'.tr(),
                  style: context.textTheme.titleSmall?.copyWith(
                    color: context.colorScheme.onSurface,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}
```

**Step 2: Update DriftLibraryPage**

In `mobile/lib/presentation/pages/drift_library.page.dart`:

Add `_AlbumsCollectionCard` to `_CollectionCards` (line 136):

```dart
// Before:
children: [_PeopleCollectionCard(), _PlacesCollectionCard(), _LocalAlbumsCollectionCard()],
// After:
children: [_PeopleCollectionCard(), _PlacesCollectionCard(), _LocalAlbumsCollectionCard(), _AlbumsCollectionCard()],
```

In `_QuickAccessButtonList`, replace Spaces ListTile (lines 392-396) with Albums:

```dart
// Before:
ListTile(
  leading: const Icon(Icons.workspaces_outlined, size: 26),
  title: Text('Spaces', style: context.textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w500)),
  onTap: () => context.pushRoute(const SpacesRoute()),
),
// After:
ListTile(
  leading: const Icon(Icons.photo_album_outlined, size: 26),
  title: Text('albums'.t(context: context), style: context.textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w500)),
  onTap: () => context.pushRoute(const DriftAlbumsRoute()),
),
```

Add the `_AlbumsCollectionCard` widget (after `_LocalAlbumsCollectionCard`):

```dart
class _AlbumsCollectionCard extends ConsumerWidget {
  const _AlbumsCollectionCard();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final albums = ref.watch(remoteAlbumProvider);

    return LayoutBuilder(
      builder: (context, constraints) {
        final isTablet = constraints.maxWidth > 600;
        final widthFactor = isTablet ? 0.25 : 0.5;
        final size = context.width * widthFactor - 20.0;

        return GestureDetector(
          onTap: () => context.pushRoute(const DriftAlbumsRoute()),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              SizedBox(
                height: size,
                width: size,
                child: DecoratedBox(
                  decoration: BoxDecoration(
                    borderRadius: const BorderRadius.all(Radius.circular(20)),
                    gradient: LinearGradient(
                      colors: [context.colorScheme.primary.withAlpha(30), context.colorScheme.primary.withAlpha(25)],
                      begin: Alignment.topCenter,
                      end: Alignment.bottomCenter,
                    ),
                  ),
                  child: albums.when(
                    data: (data) {
                      return GridView.count(
                        crossAxisCount: 2,
                        padding: const EdgeInsets.all(12),
                        crossAxisSpacing: 8,
                        mainAxisSpacing: 8,
                        physics: const NeverScrollableScrollPhysics(),
                        children: data.take(4).map((album) {
                          return ClipRRect(
                            borderRadius: const BorderRadius.all(Radius.circular(8)),
                            child: album.thumbnailAssetId != null
                                ? Image(
                                    image: RemoteImageProvider.thumbnail(
                                      assetId: album.thumbnailAssetId!,
                                      thumbhash: '',
                                    ),
                                    fit: BoxFit.cover,
                                  )
                                : Container(color: context.colorScheme.surfaceContainerHigh),
                          );
                        }).toList(),
                      );
                    },
                    error: (_, __) => const Center(child: Icon(Icons.photo_album_outlined, size: 48)),
                    loading: () => const Center(child: CircularProgressIndicator()),
                  ),
                ),
              ),
              Padding(
                padding: const EdgeInsets.all(8.0),
                child: Text(
                  'albums'.t(context: context),
                  style: context.textTheme.titleSmall?.copyWith(
                    color: context.colorScheme.onSurface,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}
```

Note: You'll need to check the exact provider and model for drift albums — look at `remoteAlbumProvider` to see what data shape it returns and whether it has a `thumbnailAssetId` field. Adapt accordingly.

**Step 3: Commit**

```bash
cd mobile && git add -A && git commit -m "feat(mobile): add albums collection card and list item to library"
```

---

### Task 4: Create SpaceCollage widget

**Files:**

- Create: `mobile/lib/widgets/spaces/space_collage.dart`

**Step 1: Create the collage widget**

This widget takes `recentAssetIds`, `recentAssetThumbhashes`, and a `color` enum, and renders one of 4 layouts.

```dart
import 'package:flutter/material.dart';
import 'package:immich_mobile/presentation/widgets/images/remote_image_provider.dart';
import 'package:immich_mobile/utils/image_url_builder.dart';
import 'package:openapi/api.dart';

/// Maps space color enum to gradient color pairs
List<Color> spaceGradientColors(SharedSpaceResponseDtoColorEnum? color) {
  switch (color?.value) {
    case 'pink':
      return [const Color(0xFFF9A8D4), const Color(0xFFEC4899)];
    case 'red':
      return [const Color(0xFFF87171), const Color(0xFFDC2626)];
    case 'yellow':
      return [const Color(0xFFFDE047), const Color(0xFFEAB308)];
    case 'blue':
      return [const Color(0xFF60A5FA), const Color(0xFF2563EB)];
    case 'green':
      return [const Color(0xFF4ADE80), const Color(0xFF15803D)];
    case 'purple':
      return [const Color(0xFFC084FC), const Color(0xFF7E22CE)];
    case 'orange':
      return [const Color(0xFFFB923C), const Color(0xFFEA580C)];
    case 'gray':
      return [const Color(0xFF9CA3AF), const Color(0xFF4B5563)];
    case 'amber':
      return [const Color(0xFFFBBF24), const Color(0xFFD97706)];
    default: // primary
      return [const Color(0xFF6366F1), const Color(0xFF4338CA)];
  }
}

class SpaceCollage extends StatelessWidget {
  final List<String> recentAssetIds;
  final List<String> recentAssetThumbhashes;
  final SharedSpaceResponseDtoColorEnum? color;
  final double size;

  const SpaceCollage({
    super.key,
    required this.recentAssetIds,
    required this.recentAssetThumbhashes,
    this.color,
    required this.size,
  });

  Widget _buildImage(int index) {
    final assetId = recentAssetIds[index];
    final thumbhash = index < recentAssetThumbhashes.length ? recentAssetThumbhashes[index] : '';
    return Image(
      image: RemoteImageProvider.thumbnail(assetId: assetId, thumbhash: thumbhash),
      fit: BoxFit.cover,
      width: double.infinity,
      height: double.infinity,
      errorBuilder: (_, __, ___) => Container(
        color: spaceGradientColors(color).first.withAlpha(100),
      ),
    );
  }

  Widget _buildEmptyState() {
    final colors = spaceGradientColors(color);
    return Container(
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: colors,
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
      ),
      child: Center(
        child: Icon(
          Icons.photo_library_outlined,
          size: size * 0.3,
          color: Colors.white.withAlpha(180),
        ),
      ),
    );
  }

  Widget _buildSingle() {
    return _buildImage(0);
  }

  Widget _buildAsymmetric() {
    final count = recentAssetIds.length;
    return Row(
      children: [
        Expanded(
          flex: 3,
          child: _buildImage(0),
        ),
        const SizedBox(width: 2),
        Expanded(
          flex: 2,
          child: Column(
            children: [
              Expanded(child: _buildImage(1)),
              if (count >= 3) ...[
                const SizedBox(height: 2),
                Expanded(child: _buildImage(2)),
              ],
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildGrid() {
    return Column(
      children: [
        Expanded(
          child: Row(
            children: [
              Expanded(child: _buildImage(0)),
              const SizedBox(width: 2),
              Expanded(child: _buildImage(1)),
            ],
          ),
        ),
        const SizedBox(height: 2),
        Expanded(
          child: Row(
            children: [
              Expanded(child: _buildImage(2)),
              const SizedBox(width: 2),
              Expanded(child: _buildImage(3)),
            ],
          ),
        ),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    final count = recentAssetIds.length;
    Widget content;

    if (count == 0) {
      content = _buildEmptyState();
    } else if (count == 1) {
      content = _buildSingle();
    } else if (count <= 3) {
      content = _buildAsymmetric();
    } else {
      content = _buildGrid();
    }

    return ClipRRect(
      borderRadius: const BorderRadius.all(Radius.circular(16)),
      child: SizedBox(
        width: size,
        height: size,
        child: content,
      ),
    );
  }
}
```

**Step 2: Commit**

```bash
cd mobile && git add -A && git commit -m "feat(mobile): add SpaceCollage widget with 4 layout variants"
```

---

### Task 5: Create SpaceCard widget

**Files:**

- Create: `mobile/lib/widgets/spaces/space_card.dart`

**Step 1: Create the card widget**

```dart
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/widgets/spaces/space_collage.dart';
import 'package:immich_mobile/widgets/common/user_circle_avatar.dart';
import 'package:immich_mobile/domain/models/user.model.dart';
import 'package:openapi/api.dart';

class SpaceCard extends StatelessWidget {
  final SharedSpaceResponseDto space;
  final VoidCallback onTap;

  const SpaceCard({super.key, required this.space, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final cardWidth = constraints.maxWidth;

        return GestureDetector(
          onTap: onTap,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Collage with overlays
              Stack(
                children: [
                  SpaceCollage(
                    recentAssetIds: space.recentAssetIds,
                    recentAssetThumbhashes: space.recentAssetThumbhashes,
                    color: space.color,
                    size: cardWidth,
                  ),
                  // Activity dot
                  if ((space.newAssetCount ?? 0) > 0)
                    Positioned(
                      top: 8,
                      right: 8,
                      child: Container(
                        width: 10,
                        height: 10,
                        decoration: BoxDecoration(
                          color: context.primaryColor,
                          shape: BoxShape.circle,
                          boxShadow: [
                            BoxShadow(
                              color: context.primaryColor.withAlpha(100),
                              blurRadius: 6,
                              spreadRadius: 2,
                            ),
                          ],
                        ),
                      ),
                    ),
                  // Member avatars
                  if (space.members.isNotEmpty)
                    Positioned(
                      bottom: 8,
                      right: 8,
                      child: _MemberAvatarStack(members: space.members),
                    ),
                ],
              ),
              // Space name
              Padding(
                padding: const EdgeInsets.only(top: 8),
                child: Text(
                  space.name,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: context.textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w600),
                ),
              ),
              // Activity text
              if ((space.newAssetCount ?? 0) > 0)
                Padding(
                  padding: const EdgeInsets.only(top: 2),
                  child: Text(
                    _activityText(space),
                    style: context.textTheme.bodySmall?.copyWith(
                      color: context.primaryColor,
                      fontWeight: FontWeight.w500,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
              // Details row
              Padding(
                padding: const EdgeInsets.only(top: 2),
                child: Text(
                  _detailsText(space),
                  style: context.textTheme.bodySmall?.copyWith(
                    color: context.colorScheme.onSurface.withAlpha(150),
                  ),
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  String _activityText(SharedSpaceResponseDto space) {
    final count = space.newAssetCount!.toInt();
    final countStr = count > 99 ? '99+' : '$count';
    final contributor = space.lastContributor?.name;
    if (contributor != null) {
      return '$contributor added $countStr new';
    }
    return '$countStr new photos';
  }

  String _detailsText(SharedSpaceResponseDto space) {
    final photos = space.assetCount?.toInt() ?? 0;
    final members = space.memberCount?.toInt() ?? 0;
    return '$photos photos \u00b7 $members members';
  }
}

class _MemberAvatarStack extends StatelessWidget {
  final List<SharedSpaceMemberResponseDto> members;
  static const _maxVisible = 4;
  static const _avatarSize = 28.0;
  static const _overlap = 8.0;

  const _MemberAvatarStack({required this.members});

  @override
  Widget build(BuildContext context) {
    final visible = members.take(_maxVisible).toList();
    final overflow = members.length - _maxVisible;
    final totalWidth = visible.length * (_avatarSize - _overlap) + _overlap + (overflow > 0 ? _avatarSize - _overlap : 0);

    return SizedBox(
      height: _avatarSize,
      width: totalWidth,
      child: Stack(
        children: [
          for (int i = 0; i < visible.length; i++)
            Positioned(
              left: i * (_avatarSize - _overlap),
              child: Container(
                width: _avatarSize,
                height: _avatarSize,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: _avatarColorFromMember(visible[i]),
                  border: Border.all(color: Colors.white, width: 1.5),
                  boxShadow: const [BoxShadow(color: Colors.black12, blurRadius: 2)],
                ),
                child: Center(
                  child: Text(
                    visible[i].name?[0].toUpperCase() ?? '?',
                    style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold),
                  ),
                ),
              ),
            ),
          if (overflow > 0)
            Positioned(
              left: visible.length * (_avatarSize - _overlap),
              child: Container(
                width: _avatarSize,
                height: _avatarSize,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: Colors.grey.shade500,
                  border: Border.all(color: Colors.white, width: 1.5),
                  boxShadow: const [BoxShadow(color: Colors.black12, blurRadius: 2)],
                ),
                child: Center(
                  child: Text(
                    '+$overflow',
                    style: const TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.w600),
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }

  Color _avatarColorFromMember(SharedSpaceMemberResponseDto member) {
    // Use the member's avatar color, falling back to a hash-based color
    final name = member.name ?? '';
    final colors = [
      Colors.indigo,
      Colors.pink,
      Colors.red,
      Colors.amber,
      Colors.blue,
      Colors.green,
      Colors.purple,
      Colors.orange,
      Colors.grey,
      Colors.teal,
    ];
    return colors[name.hashCode.abs() % colors.length];
  }
}
```

Note: The `SharedSpaceMemberResponseDto` may have different field names — check the generated model for exact fields (`name`, `email`, `userId`, `profileImagePath`, `avatarColor`). Adapt `_MemberAvatarStack` accordingly. If `profileImagePath` is available, use `RemoteImageProvider` for the avatar image instead of the text initial.

**Step 2: Commit**

```bash
cd mobile && git add -A && git commit -m "feat(mobile): add SpaceCard widget with activity indicators and member avatars"
```

---

### Task 6: Redesign SpacesPage with card grid

**Files:**

- Modify: `mobile/lib/pages/library/spaces/spaces.page.dart`

**Step 1: Rewrite SpacesPage**

Replace the entire `build` method content. The page should:

- Use `ImmichSliverAppBar` or just an `AppBar` (since it's now a tab, it should match the tab app bar style)
- Display a 2-column grid of `SpaceCard` widgets
- Keep pull-to-refresh
- Keep the FAB for creating spaces
- Keep the empty state but update visuals

```dart
import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/providers/shared_space.provider.dart';
import 'package:immich_mobile/repositories/shared_space_api.repository.dart';
import 'package:immich_mobile/routing/router.dart';
import 'package:immich_mobile/widgets/common/immich_app_bar.dart';
import 'package:immich_mobile/widgets/common/immich_toast.dart';
import 'package:immich_mobile/widgets/spaces/space_card.dart';

@RoutePage()
class SpacesPage extends HookConsumerWidget {
  const SpacesPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final spacesAsync = ref.watch(sharedSpacesProvider);

    Future<void> createSpaceDialog() async {
      final nameController = TextEditingController();
      final descController = TextEditingController();

      final result = await showDialog<bool>(
        context: context,
        builder: (context) {
          return AlertDialog(
            title: const Text('Create Space'),
            content: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                TextField(
                  controller: nameController,
                  decoration: const InputDecoration(labelText: 'Name', hintText: 'Enter space name'),
                  autofocus: true,
                ),
                const SizedBox(height: 8),
                TextField(
                  controller: descController,
                  decoration: const InputDecoration(labelText: 'Description (optional)', hintText: 'Enter description'),
                ),
              ],
            ),
            actions: [
              TextButton(onPressed: () => Navigator.of(context).pop(false), child: const Text('Cancel')),
              TextButton(onPressed: () => Navigator.of(context).pop(true), child: const Text('Create')),
            ],
          );
        },
      );

      if (result == true && nameController.text.isNotEmpty) {
        try {
          final description = descController.text.isEmpty ? null : descController.text;
          await ref.read(sharedSpaceApiRepositoryProvider).create(nameController.text, description: description);
          ref.invalidate(sharedSpacesProvider);
        } catch (e) {
          if (context.mounted) {
            ImmichToast.show(context: context, msg: 'Failed to create space: $e', toastType: ToastType.error);
          }
        }
      }

      nameController.dispose();
      descController.dispose();
    }

    return Scaffold(
      appBar: const ImmichAppBar(),
      body: spacesAsync.when(
        data: (spaces) {
          if (spaces.isEmpty) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.workspaces_outlined, size: 64, color: context.colorScheme.onSurface.withAlpha(100)),
                  const SizedBox(height: 16),
                  Text(
                    'No spaces yet',
                    style: context.textTheme.titleMedium?.copyWith(color: context.colorScheme.onSurface.withAlpha(150)),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Create a space to share photos with others',
                    style: context.textTheme.bodyMedium?.copyWith(color: context.colorScheme.onSurface.withAlpha(100)),
                  ),
                  const SizedBox(height: 24),
                  ElevatedButton.icon(
                    onPressed: createSpaceDialog,
                    icon: const Icon(Icons.add),
                    label: const Text('Create Space'),
                  ),
                ],
              ),
            );
          }

          return RefreshIndicator(
            onRefresh: () async => ref.invalidate(sharedSpacesProvider),
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: GridView.builder(
                gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: 2,
                  crossAxisSpacing: 12,
                  mainAxisSpacing: 16,
                  childAspectRatio: 0.72,
                ),
                itemCount: spaces.length,
                itemBuilder: (context, index) {
                  final space = spaces[index];
                  return SpaceCard(
                    space: space,
                    onTap: () async {
                      await context.pushRoute(SpaceDetailRoute(spaceId: space.id));
                      ref.invalidate(sharedSpacesProvider);
                    },
                  );
                },
              ),
            ),
          );
        },
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, stack) => Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.error_outline, size: 48),
              const SizedBox(height: 16),
              Text('Failed to load spaces: $error'),
              const SizedBox(height: 16),
              ElevatedButton(onPressed: () => ref.invalidate(sharedSpacesProvider), child: const Text('Retry')),
            ],
          ),
        ),
      ),
      floatingActionButton: FloatingActionButton(onPressed: createSpaceDialog, child: const Icon(Icons.add)),
    );
  }
}
```

**Step 2: Adjust childAspectRatio if needed**

The `childAspectRatio: 0.72` may need tuning depending on how tall the text content is. Test visually and adjust.

**Step 3: Commit**

```bash
cd mobile && git add -A && git commit -m "feat(mobile): redesign spaces page with card grid and collage thumbnails"
```

---

### Task 7: Build and verify

**Step 1: Regenerate auto_route if not already done**

```bash
cd mobile && dart run build_runner build --delete-conflicting-outputs
```

**Step 2: Run analyzer**

```bash
cd mobile && dart analyze
```

Fix any import errors, type mismatches, or missing references.

**Step 3: Run tests**

```bash
cd mobile && flutter test
```

Fix any broken tests (likely tab-related tests that reference old enum values).

**Step 4: Commit any fixes**

```bash
cd mobile && git add -A && git commit -m "fix(mobile): resolve analyzer warnings and test failures"
```
