import 'dart:async';

import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/album/local_album.model.dart';
import 'package:immich_mobile/domain/services/sync_linked_album.service.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/generated/translations.g.dart';
import 'package:immich_mobile/infrastructure/repositories/settings.repository.dart';
import 'package:immich_mobile/providers/background_sync.provider.dart';
import 'package:immich_mobile/providers/backup/backup.provider.dart';
import 'package:immich_mobile/providers/backup/backup_album.provider.dart';
import 'package:immich_mobile/providers/infrastructure/platform.provider.dart';
import 'package:immich_mobile/providers/infrastructure/settings.provider.dart';
import 'package:immich_mobile/providers/user.provider.dart';
import 'package:immich_mobile/widgets/backup/album_info_list_tile.dart';
import 'package:immich_mobile/widgets/common/search_field.dart';
import 'package:logging/logging.dart';

final backupAlbumCountProvider = FutureProvider.autoDispose<int>((ref) async {
  await ref.read(backupAlbumProvider.notifier).getAll();
  return ref.read(backupAlbumProvider).length;
});

@RoutePage()
class BackupAlbumSelectionPage extends ConsumerStatefulWidget {
  const BackupAlbumSelectionPage({super.key});

  @override
  ConsumerState<BackupAlbumSelectionPage> createState() => _BackupAlbumSelectionPageState();
}

class _BackupAlbumSelectionPageState extends ConsumerState<BackupAlbumSelectionPage> {
  String _searchQuery = '';
  bool _isSearchMode = false;
  int _initialTotalAssetCount = 0;
  late ValueNotifier<bool> _enableSyncUploadAlbum;
  late TextEditingController _searchController;
  late FocusNode _searchFocusNode;
  Future? _handleLinkedAlbumFuture;

  @override
  void initState() {
    super.initState();
    _enableSyncUploadAlbum = ValueNotifier<bool>(false);
    _searchController = TextEditingController();
    _searchFocusNode = FocusNode();

    _enableSyncUploadAlbum.value = ref.read(appConfigProvider).backup.syncAlbums;

    _initialTotalAssetCount = ref.read(backupProvider.select((p) => p.totalCount));
  }

  Future<void> _handlePagePopped() async {
    final user = ref.read(currentUserProvider);
    if (user == null) {
      return;
    }

    final enableSyncUploadAlbum = ref.read(appConfigProvider).backup.syncAlbums;
    final selectedAlbums = ref
        .read(backupAlbumProvider)
        .where((a) => a.backupSelection == BackupSelection.selected)
        .toList();

    if (enableSyncUploadAlbum && selectedAlbums.isNotEmpty) {
      setState(() {
        _handleLinkedAlbumFuture = ref.read(syncLinkedAlbumServiceProvider).manageLinkedAlbums(selectedAlbums, user.id);
      });
      await _handleLinkedAlbumFuture;
    }
  }

  @override
  void dispose() {
    _enableSyncUploadAlbum.dispose();
    _searchController.dispose();
    _searchFocusNode.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final isLoading = ref.watch(backupAlbumCountProvider).isLoading;
    final albums = ref.watch(backupAlbumProvider);
    final albumCount = albums.length;
    // Filter albums based on search query
    final filteredAlbums = albums.where((album) {
      if (_searchQuery.isEmpty) {
        return true;
      }
      return album.name.toLowerCase().contains(_searchQuery.toLowerCase());
    }).toList();

    final selectedBackupAlbums = albums.where((album) => album.backupSelection == BackupSelection.selected).toList();
    final excludedBackupAlbums = albums.where((album) => album.backupSelection == BackupSelection.excluded).toList();

    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (didPop, _) async {
        if (!didPop) {
          await _handlePagePopped();
          if (!mounted) {
            return;
          }

          final user = ref.read(currentUserProvider);
          if (user == null) {
            return;
          }

          final isBackupEnabled = SettingsRepository.instance.appConfig.backup.enabled;
          await ref.read(backupProvider.notifier).getBackupStatus(user.id);
          if (!mounted) {
            return;
          }

          final currentTotalAssetCount = ref.read(backupProvider.select((p) => p.totalCount));
          final totalChanged = currentTotalAssetCount != _initialTotalAssetCount;
          final backupNotifier = ref.read(backupProvider.notifier);
          final backgroundSync = ref.read(backgroundSyncProvider);
          final nativeSync = ref.read(nativeSyncApiProvider);
          if (totalChanged) {
            // Waits for hashing to be cancelled before starting a new one
            unawaited(nativeSync.cancelHashing().whenComplete(() => backgroundSync.hashAssets()));
            if (isBackupEnabled) {
              backupNotifier.stopForegroundBackup(reason: "backup albums updated");
              unawaited(
                backgroundSync.syncRemote().then((success) {
                  if (success) {
                    return backupNotifier.startForegroundBackup(user.id);
                  } else {
                    Logger('BackupAlbumSelectionPage').warning('Background sync failed, not starting backup');
                  }
                }),
              );
            }
          }

          if (!context.mounted) {
            return;
          }

          Navigator.of(context).pop();
        }
      },
      child: Scaffold(
        appBar: AppBar(
          leading: IconButton(
            onPressed: () async => await context.maybePop(),
            icon: const Icon(Icons.arrow_back_ios_rounded),
          ),
          title: _isSearchMode
              ? SearchField(
                  hintText: context.t.search_albums,
                  autofocus: true,
                  controller: _searchController,
                  focusNode: _searchFocusNode,
                  onChanged: (value) => setState(() => _searchQuery = value.trim()),
                )
              : Text(context.t.backup_album_selection_page_select_albums),
          actions: [
            if (!_isSearchMode)
              IconButton(
                icon: const Icon(Icons.search),
                onPressed: () => setState(() {
                  _isSearchMode = true;
                  _searchQuery = '';
                }),
              )
            else
              IconButton(
                icon: const Icon(Icons.close),
                onPressed: () => setState(() {
                  _isSearchMode = false;
                  _searchQuery = '';
                  _searchController.clear();
                }),
              ),
          ],
          elevation: 0,
        ),
        body: Stack(
          children: [
            CustomScrollView(
              physics: const ClampingScrollPhysics(),
              slivers: [
                SliverToBoxAdapter(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Padding(
                        padding: const EdgeInsets.symmetric(vertical: 8.0, horizontal: 16.0),
                        child: Text(
                          context.t.backup_album_selection_page_selection_info,
                          style: context.textTheme.titleSmall,
                        ),
                      ),

                      // Selected Album Chips
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 16.0),
                        child: Wrap(
                          children: [
                            _SelectedAlbumNameChips(selectedBackupAlbums: selectedBackupAlbums),
                            _ExcludedAlbumNameChips(excludedBackupAlbums: excludedBackupAlbums),
                          ],
                        ),
                      ),
                      ListTile(
                        title: Text(
                          context.t.albums_on_device_count(count: albumCount),
                          style: context.textTheme.titleSmall,
                        ),
                        subtitle: Padding(
                          padding: const EdgeInsets.symmetric(vertical: 8.0),
                          child: Text(
                            context.t.backup_album_selection_page_albums_tap,
                            style: context.textTheme.labelLarge?.copyWith(color: context.primaryColor),
                          ),
                        ),
                        trailing: IconButton(
                          splashRadius: 16,
                          icon: Icon(Icons.info, size: 20, color: context.primaryColor),
                          onPressed: () {
                            unawaited(
                              showDialog(
                                context: context,
                                builder: (BuildContext context) {
                                  return AlertDialog(
                                    shape: const RoundedRectangleBorder(
                                      borderRadius: BorderRadius.all(Radius.circular(10)),
                                    ),
                                    elevation: 5,
                                    title: Text(
                                      context.t.backup_album_selection_page_selection_info,
                                      style: TextStyle(
                                        fontSize: 16,
                                        fontWeight: FontWeight.bold,
                                        color: context.primaryColor,
                                      ),
                                    ),
                                    content: SingleChildScrollView(
                                      child: ListBody(
                                        children: [
                                          Text(
                                            context.t.backup_album_selection_page_assets_scatter,
                                            style: const TextStyle(fontSize: 14),
                                          ),
                                        ],
                                      ),
                                    ),
                                  );
                                },
                              ),
                            );
                          },
                        ),
                      ),

                      _SelectAllButton(filteredAlbums: filteredAlbums, selectedBackupAlbums: selectedBackupAlbums),
                    ],
                  ),
                ),
                if (filteredAlbums.isEmpty)
                  SliverToBoxAdapter(
                    child: Center(
                      child: _searchQuery.isNotEmpty
                          ? Padding(padding: const EdgeInsets.all(24.0), child: Text(context.t.album_search_not_found))
                          : isLoading
                          ? const CircularProgressIndicator()
                          : Padding(padding: const EdgeInsets.all(24.0), child: Text(context.t.no_albums_found)),
                    ),
                  )
                else
                  SliverLayoutBuilder(
                    builder: (context, constraints) {
                      if (constraints.crossAxisExtent > 600) {
                        return _AlbumSelectionGrid(filteredAlbums: filteredAlbums);
                      } else {
                        return _AlbumSelectionList(filteredAlbums: filteredAlbums);
                      }
                    },
                  ),
              ],
            ),
            if (_handleLinkedAlbumFuture != null)
              FutureBuilder(
                future: _handleLinkedAlbumFuture,
                builder: (context, snapshot) {
                  return SizedBox(
                    height: double.infinity,
                    width: double.infinity,
                    child: ColoredBox(
                      color: context.scaffoldBackgroundColor.withValues(alpha: 0.8),
                      child: Center(
                        child: Column(
                          spacing: 16,
                          crossAxisAlignment: CrossAxisAlignment.center,
                          mainAxisAlignment: MainAxisAlignment.center,
                          mainAxisSize: MainAxisSize.max,
                          children: [
                            const CircularProgressIndicator(strokeWidth: 4),
                            Text(context.t.creating_linked_albums, style: context.textTheme.labelLarge),
                          ],
                        ),
                      ),
                    ),
                  );
                },
              ),
          ],
        ),
      ),
    );
  }
}

class _AlbumSelectionList extends StatelessWidget {
  final List<LocalAlbum> filteredAlbums;

  const _AlbumSelectionList({required this.filteredAlbums});

  @override
  Widget build(BuildContext context) {
    return SliverPadding(
      padding: const EdgeInsets.symmetric(vertical: 12.0),
      sliver: SliverList(
        delegate: SliverChildBuilderDelegate((context, index) {
          return AlbumInfoListTile(album: filteredAlbums[index]);
        }, childCount: filteredAlbums.length),
      ),
    );
  }
}

class _AlbumSelectionGrid extends StatelessWidget {
  final List<LocalAlbum> filteredAlbums;

  const _AlbumSelectionGrid({required this.filteredAlbums});

  @override
  Widget build(BuildContext context) {
    return SliverPadding(
      padding: const EdgeInsets.all(12.0),
      sliver: SliverGrid.builder(
        gridDelegate: const SliverGridDelegateWithMaxCrossAxisExtent(
          maxCrossAxisExtent: 300,
          mainAxisSpacing: 12,
          crossAxisSpacing: 12,
        ),
        itemCount: filteredAlbums.length,
        itemBuilder: (context, index) {
          return AlbumInfoListTile(album: filteredAlbums[index]);
        },
      ),
    );
  }
}

class _SelectedAlbumNameChips extends ConsumerWidget {
  final List<LocalAlbum> selectedBackupAlbums;

  const _SelectedAlbumNameChips({required this.selectedBackupAlbums});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Wrap(
      children: selectedBackupAlbums.asMap().entries.map((entry) {
        final album = entry.value;

        Future<void> removeSelection() {
          return ref.read(backupAlbumProvider.notifier).deselectAlbum(album);
        }

        return Padding(
          padding: const EdgeInsets.only(right: 8.0),
          child: GestureDetector(
            onTap: () => unawaited(removeSelection()),
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 200),
              curve: Curves.easeInOut,
              child: Chip(
                label: Text(
                  album.name,
                  style: TextStyle(
                    fontSize: 12,
                    color: context.isDarkTheme ? Colors.black : Colors.white,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                backgroundColor: context.primaryColor,
                deleteIconColor: context.isDarkTheme ? Colors.black : Colors.white,
                deleteIcon: const Icon(Icons.cancel_rounded, size: 15),
                onDeleted: () => unawaited(removeSelection()),
              ),
            ),
          ),
        );
      }).toList(),
    );
  }
}

class _ExcludedAlbumNameChips extends ConsumerWidget {
  final List<LocalAlbum> excludedBackupAlbums;

  const _ExcludedAlbumNameChips({required this.excludedBackupAlbums});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Wrap(
      children: excludedBackupAlbums.asMap().entries.map((entry) {
        final album = entry.value;

        Future<void> removeSelection() {
          return ref.read(backupAlbumProvider.notifier).deselectAlbum(album);
        }

        return GestureDetector(
          onTap: () => unawaited(removeSelection()),
          child: Padding(
            padding: const EdgeInsets.only(right: 8.0),
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 200),
              curve: Curves.easeInOut,
              child: Chip(
                label: Text(
                  album.name,
                  style: TextStyle(fontSize: 12, color: context.scaffoldBackgroundColor, fontWeight: FontWeight.bold),
                ),
                backgroundColor: Colors.red[300],
                deleteIconColor: context.scaffoldBackgroundColor,
                deleteIcon: const Icon(Icons.cancel_rounded, size: 15),
                onDeleted: () => unawaited(removeSelection()),
              ),
            ),
          ),
        );
      }).toList(),
    );
  }
}

class _SelectAllButton extends ConsumerWidget {
  final List<LocalAlbum> filteredAlbums;
  final List<LocalAlbum> selectedBackupAlbums;

  const _SelectAllButton({required this.filteredAlbums, required this.selectedBackupAlbums});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final canSelectAll = filteredAlbums.where((album) => album.backupSelection != BackupSelection.selected).isNotEmpty;

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 8.0),
      child: Row(
        children: [
          Expanded(
            child: ElevatedButton.icon(
              onPressed: canSelectAll
                  ? () {
                      for (final album in filteredAlbums) {
                        if (album.backupSelection != BackupSelection.selected) {
                          unawaited(ref.read(backupAlbumProvider.notifier).selectAlbum(album));
                        }
                      }
                    }
                  : null,
              icon: const Icon(Icons.select_all),
              label: AnimatedSwitcher(duration: const Duration(milliseconds: 200), child: Text(context.t.select_all)),
              style: ElevatedButton.styleFrom(padding: const EdgeInsets.symmetric(vertical: 12.0)),
            ),
          ),
          const SizedBox(width: 8.0),
          Expanded(
            child: OutlinedButton.icon(
              onPressed: selectedBackupAlbums.isNotEmpty
                  ? () {
                      for (final album in filteredAlbums) {
                        if (album.backupSelection == BackupSelection.selected) {
                          unawaited(ref.read(backupAlbumProvider.notifier).deselectAlbum(album));
                        }
                      }
                    }
                  : null,
              icon: const Icon(Icons.deselect),
              label: Text(context.t.deselect_all),
              style: OutlinedButton.styleFrom(padding: const EdgeInsets.symmetric(vertical: 12.0)),
            ),
          ),
        ],
      ),
    );
  }
}
