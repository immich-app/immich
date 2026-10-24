import 'dart:async';

import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/services/locked_album_session.dart';
import 'package:immich_mobile/generated/translations.g.dart';
import 'package:immich_mobile/presentation/widgets/bottom_sheet/locked_folder_bottom_sheet.widget.dart';
import 'package:immich_mobile/presentation/widgets/locked_album_photos.widget.dart';
import 'package:immich_mobile/presentation/widgets/timeline/timeline.widget.dart';
import 'package:immich_mobile/providers/auth.provider.dart';
import 'package:immich_mobile/providers/infrastructure/timeline.provider.dart';
import 'package:immich_mobile/providers/user.provider.dart';
import 'package:immich_mobile/repositories/locked_album_api.repository.dart';
import 'package:immich_mobile/repositories/locked_album_media.repository.dart';
import 'package:immich_mobile/routing/router.dart';
import 'package:immich_mobile/widgets/common/mesmerizing_sliver_app_bar.dart';

@RoutePage()
class LockedFolderPage extends ConsumerStatefulWidget {
  const LockedFolderPage({super.key});

  @override
  ConsumerState<LockedFolderPage> createState() => _LockedFolderPageState();
}

class _LockedFolderPageState extends ConsumerState<LockedFolderPage> with WidgetsBindingObserver {
  bool _showOverlay = false;
  bool _showGroups = false;
  bool _editingName = false;
  bool _confirmDelete = false;
  bool _addingPhotos = false;
  final _nameController = TextEditingController();
  late final LockedAlbumSession _groups;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    _groups = LockedAlbumSession(ref.read(lockedAlbumRepositoryProvider), onRevoked: _lockAndLeave);
    _groups.addListener(_groupsChanged);
    // Capture the earlier of session/PIN expiry once. Status polling would
    // refresh server elevation and keep an idle locked folder open indefinitely.
    unawaited(_groups.initialize());
    ref.listenManual(authProvider, (previous, next) {
      if (!next.isAuthenticated || (previous != null && previous.userId != next.userId)) {
        _lockAndLeave();
      }
    });
  }

  void _groupsChanged() {
    if (mounted && !_showOverlay) {
      setState(() {});
    }
  }

  void _lockAndLeave() {
    if (!mounted || _showOverlay) {
      return;
    }
    // Clear synchronously, before starting any network or navigation futures.
    _groups.clear();
    _nameController.clear();
    setState(() => _showOverlay = true);
    unawaited(ref.read(authProvider.notifier).lockPinCode().catchError((Object _) {}));
    unawaited(context.navigateTo(const TabShellRoute()));
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    _groups.removeListener(_groupsChanged);
    _groups.dispose();
    _nameController.dispose();
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (!mounted) {
      return;
    }
    if (state != AppLifecycleState.resumed) {
      // Lock on focus loss too, so task-switcher/system sheets cannot leave
      // private group names or pending request results visible on resumption.
      _lockAndLeave();
    }
  }

  Widget _groupPanel() {
    final selected = _groups.selected;
    return Scaffold(
      appBar: AppBar(
        title: const Text('Private groups (experimental)', maxLines: 1, overflow: TextOverflow.ellipsis),
        actions: [
          IconButton(
            tooltip: 'Refresh groups',
            onPressed: _groups.busy ? null : () => unawaited(_groups.refresh()),
            icon: const Icon(Icons.refresh),
          ),
          IconButton(tooltip: 'Lock folder', onPressed: _lockAndLeave, icon: const Icon(Icons.lock_outline)),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Text(
            'Groups stay inside your locked folder. Deleting a group or removing membership does not delete or unlock photos. '
            'Group previews are memory-only and cleared when this page locks. '
            'The existing photo timeline may still cache media; this is not a media-cache privacy guarantee.',
            style: Theme.of(context).textTheme.bodySmall,
          ),
          const SizedBox(height: 16),
          if (_groups.busy) const LinearProgressIndicator(),
          if (_groups.error != null)
            Padding(padding: const EdgeInsets.symmetric(vertical: 8), child: Text(_groups.error!)),
          Row(
            children: [
              Expanded(
                child: TextField(
                  controller: _nameController,
                  enabled: !_groups.busy,
                  maxLength: 255,
                  autocorrect: false,
                  enableSuggestions: false,
                  enableIMEPersonalizedLearning: false,
                  decoration: InputDecoration(labelText: _editingName ? 'Rename selected group' : 'New group name'),
                ),
              ),
              const SizedBox(width: 8),
              TextButton(
                onPressed: _groups.busy
                    ? null
                    : () async {
                        final name = _nameController.text.trim();
                        if (name.isEmpty) {
                          return;
                        }
                        final id = _editingName ? selected?.id : null;
                        await _groups.saveName(name, id: id);
                        if (mounted && !_showOverlay && _groups.error == null) {
                          _nameController.clear();
                          setState(() => _editingName = false);
                        }
                      },
                child: Text(_editingName ? 'Save name' : 'Create'),
              ),
              if (_editingName)
                TextButton(
                  onPressed: () {
                    _nameController.clear();
                    setState(() => _editingName = false);
                  },
                  child: const Text('Cancel'),
                ),
            ],
          ),
          if (_groups.albums.isEmpty && !_groups.busy) const Text('No private groups. Create one above.'),
          for (final album in _groups.albums)
            ListTile(
              contentPadding: EdgeInsets.zero,
              leading: const Icon(Icons.folder_outlined),
              title: Text(album.albumName),
              subtitle: Text('${album.assetCount} locked assets'),
              selected: selected?.id == album.id,
              enabled: !_groups.busy,
              onTap: () {
                _nameController.clear();
                setState(() {
                  _editingName = false;
                  _confirmDelete = false;
                  _addingPhotos = false;
                });
                unawaited(_groups.select(album));
              },
            ),
          if (selected != null) ...[
            const Divider(),
            Text(selected.albumName, style: Theme.of(context).textTheme.titleLarge),
            Wrap(
              spacing: 8,
              children: [
                TextButton(
                  onPressed: _groups.busy
                      ? null
                      : () {
                          _nameController.text = selected.albumName;
                          setState(() => _editingName = true);
                        },
                  child: const Text('Rename'),
                ),
                TextButton(
                  onPressed: _groups.busy ? null : () => setState(() => _confirmDelete = !_confirmDelete),
                  child: const Text('Delete group'),
                ),
              ],
            ),
            if (_confirmDelete) ...[
              const Text('Delete this group only? All photos remain in your locked folder. This cannot be undone.'),
              TextButton(
                onPressed: _groups.busy
                    ? null
                    : () {
                        _nameController.clear();
                        setState(() {
                          _confirmDelete = false;
                          _editingName = false;
                        });
                        unawaited(_groups.deleteSelected());
                      },
                child: const Text('Confirm delete group'),
              ),
              TextButton(onPressed: () => setState(() => _confirmDelete = false), child: const Text('Cancel')),
            ],
            const SizedBox(height: 8),
            TextButton(
              onPressed: _groups.busy ? null : () => setState(() => _addingPhotos = !_addingPhotos),
              child: Text(_addingPhotos ? 'Done choosing photos' : 'Add locked photos'),
            ),
            if (!_groups.busy && ref.read(currentUserProvider) != null)
              LockedAlbumPhotos(
                key: ValueKey('${selected.id}:$_addingPhotos:${_groups.assetIds.join(',')}'),
                session: _groups,
                ownerId: ref.read(currentUserProvider)!.id,
                add: _addingPhotos,
                thumbnail: ref.read(lockedAlbumMediaProvider).thumbnail,
                load: (offset) async {
                  final media = ref.read(lockedAlbumMediaProvider);
                  if (_addingPhotos) {
                    return media.list(ref.read(currentUserProvider)!.id, offset);
                  }
                  final assets = await Future.wait(_groups.assetIds.map(media.get));
                  return assets.nonNulls.toList();
                },
              ),
            if (!_addingPhotos && _groups.hasNextPage)
              TextButton(
                onPressed: _groups.busy ? null : () => unawaited(_groups.loadMore()),
                child: const Text('Load more members'),
              ),
          ],
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return ProviderScope(
      overrides: [
        timelineServiceProvider.overrideWith((ref) {
          final user = ref.watch(currentUserProvider);
          if (user == null) {
            throw Exception('User must be logged in to access locked folder');
          }

          final timelineService = ref.watch(timelineFactoryProvider).lockedFolder(user.id);
          ref.onDispose(timelineService.dispose);
          return timelineService;
        }),
      ],
      child: _showOverlay
          ? const SizedBox()
          : PopScope(
              onPopInvokedWithResult: (didPop, _) {
                if (didPop) {
                  _groups.clear();
                  _nameController.clear();
                  setState(() => _showOverlay = true);
                  unawaited(ref.read(authProvider.notifier).lockPinCode().catchError((Object _) {}));
                }
              },
              child: !_groups.isReady
                  ? const Material(child: Center(child: CircularProgressIndicator()))
                  : Material(
                      child: Column(
                        children: [
                          SafeArea(
                            bottom: false,
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                TextButton(
                                  onPressed: () => setState(() => _showGroups = false),
                                  child: const Text('Locked photos'),
                                ),
                                TextButton(
                                  onPressed: () {
                                    setState(() => _showGroups = true);
                                    unawaited(_groups.refresh());
                                  },
                                  child: const Text('Private groups'),
                                ),
                              ],
                            ),
                          ),
                          Expanded(
                            child: _showGroups
                                ? _groupPanel()
                                : Timeline(
                                    appBar: MesmerizingSliverAppBar(title: context.t.locked_folder),
                                    bottomSheet: const LockedFolderBottomSheet(),
                                  ),
                          ),
                        ],
                      ),
                    ),
            ),
    );
  }
}
