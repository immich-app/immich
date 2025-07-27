import 'dart:io';

import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/album/local_album.model.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/extensions/translate_extensions.dart';
import 'package:immich_mobile/providers/album/album.provider.dart';
import 'package:immich_mobile/providers/app_settings.provider.dart';
import 'package:immich_mobile/providers/backup/backup_album.provider.dart';
import 'package:immich_mobile/providers/backup/drift_backup.provider.dart';
import 'package:immich_mobile/providers/user.provider.dart';
import 'package:immich_mobile/services/app_settings.service.dart';
import 'package:immich_mobile/widgets/backup/drift_album_info_list_tile.dart';
import 'package:immich_mobile/widgets/common/search_field.dart';
import 'package:immich_mobile/widgets/settings/settings_switch_list_tile.dart';

@RoutePage()
class DriftBackupAlbumSelectionPage extends ConsumerStatefulWidget {
  const DriftBackupAlbumSelectionPage({super.key});

  @override
  ConsumerState<DriftBackupAlbumSelectionPage> createState() => _DriftBackupAlbumSelectionPageState();
}

class _DriftBackupAlbumSelectionPageState extends ConsumerState<DriftBackupAlbumSelectionPage> {
  String _searchQuery = '';
  bool _isSearchMode = false;
  int _initialTotalAssetCount = 0;
  bool _hasPopped = false;
  late ValueNotifier<bool> _enableSyncUploadAlbum;
  late TextEditingController _searchController;
  late FocusNode _searchFocusNode;

  @override
  void initState() {
    super.initState();
    _enableSyncUploadAlbum = ValueNotifier<bool>(false);
    _searchController = TextEditingController();
    _searchFocusNode = FocusNode();

    _enableSyncUploadAlbum.value = ref.read(appSettingsServiceProvider).getSetting(AppSettingsEnum.syncAlbums);
    ref.read(backupAlbumProvider.notifier).getAll();

    _initialTotalAssetCount = ref.read(driftBackupProvider.select((p) => p.totalCount));
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
    final albums = ref.watch(backupAlbumProvider);
    final albumCount = albums.length;
    // Filter albums based on search query
    final filteredAlbums = albums.where((album) {
      if (_searchQuery.isEmpty) return true;
      return album.name.toLowerCase().contains(_searchQuery.toLowerCase());
    }).toList();

    final selectedBackupAlbums = albums.where((album) => album.backupSelection == BackupSelection.selected).toList();
    final excludedBackupAlbums = albums.where((album) => album.backupSelection == BackupSelection.excluded).toList();

    handleSyncAlbumToggle(bool isEnable) async {
      if (isEnable) {
        await ref.read(albumProvider.notifier).refreshRemoteAlbums();
        for (final album in selectedBackupAlbums) {
          await ref.read(albumProvider.notifier).createSyncAlbum(album.name);
        }
      }
    }

    return PopScope(
      onPopInvokedWithResult: (didPop, result) async {
        // There is an issue with Flutter where the pop event
        // can be triggered multiple times, so we guard it with _hasPopped
        if (didPop && !_hasPopped) {
          _hasPopped = true;

          final currentUser = ref.read(currentUserProvider);
          if (currentUser == null) {
            return;
          }

          await ref.read(driftBackupProvider.notifier).getBackupStatus(currentUser.id);
          final currentTotalAssetCount = ref.read(driftBackupProvider.select((p) => p.totalCount));

          if (currentTotalAssetCount != _initialTotalAssetCount) {
            final isBackupEnabled = ref.read(appSettingsServiceProvider).getSetting(AppSettingsEnum.enableBackup);

            if (!isBackupEnabled) {
              return;
            }
            final backupNotifier = ref.read(driftBackupProvider.notifier);

            backupNotifier.cancel().then((_) {
              backupNotifier.startBackup(currentUser.id);
            });
          }
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
                  hintText: 'search_albums'.t(context: context),
                  autofocus: true,
                  controller: _searchController,
                  focusNode: _searchFocusNode,
                  onChanged: (value) => setState(() => _searchQuery = value.trim()),
                )
              : const Text(
                  "backup_album_selection_page_select_albums",
                ).t(context: context),
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
        body: CustomScrollView(
          physics: const ClampingScrollPhysics(),
          slivers: [
            SliverToBoxAdapter(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Padding(
                    padding: const EdgeInsets.symmetric(
                      vertical: 8.0,
                      horizontal: 16.0,
                    ),
                    child: Text(
                      "backup_album_selection_page_selection_info",
                      style: context.textTheme.titleSmall,
                    ).t(context: context),
                  ),
                  // Selected Album Chips

                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 16.0),
                    child: Wrap(
                      children: [
                        _SelectedAlbumNameChips(
                          selectedBackupAlbums: selectedBackupAlbums,
                        ),
                        _ExcludedAlbumNameChips(
                          excludedBackupAlbums: excludedBackupAlbums,
                        ),
                      ],
                    ),
                  ),

                  SettingsSwitchListTile(
                    valueNotifier: _enableSyncUploadAlbum,
                    title: "sync_albums".t(context: context),
                    subtitle: "sync_upload_album_setting_subtitle".t(context: context),
                    contentPadding: const EdgeInsets.symmetric(horizontal: 16),
                    titleStyle: context.textTheme.bodyLarge?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
                    subtitleStyle: context.textTheme.labelLarge?.copyWith(
                      color: context.colorScheme.primary,
                    ),
                    onChanged: handleSyncAlbumToggle,
                  ),

                  ListTile(
                    title: Text(
                      "albums_on_device_count".t(
                        context: context,
                        args: {'count': albumCount.toString()},
                      ),
                      style: context.textTheme.titleSmall,
                    ),
                    subtitle: Padding(
                      padding: const EdgeInsets.symmetric(vertical: 8.0),
                      child: Text(
                        "backup_album_selection_page_albums_tap",
                        style: context.textTheme.labelLarge?.copyWith(
                          color: context.primaryColor,
                        ),
                      ).t(context: context),
                    ),
                    trailing: IconButton(
                      splashRadius: 16,
                      icon: Icon(
                        Icons.info,
                        size: 20,
                        color: context.primaryColor,
                      ),
                      onPressed: () {
                        // show the dialog
                        showDialog(
                          context: context,
                          builder: (BuildContext context) {
                            return AlertDialog(
                              shape: const RoundedRectangleBorder(
                                borderRadius: BorderRadius.all(Radius.circular(10)),
                              ),
                              elevation: 5,
                              title: Text(
                                'backup_album_selection_page_selection_info',
                                style: TextStyle(
                                  fontSize: 16,
                                  fontWeight: FontWeight.bold,
                                  color: context.primaryColor,
                                ),
                              ).t(context: context),
                              content: SingleChildScrollView(
                                child: ListBody(
                                  children: [
                                    const Text(
                                      'backup_album_selection_page_assets_scatter',
                                      style: TextStyle(
                                        fontSize: 14,
                                      ),
                                    ).t(context: context),
                                  ],
                                ),
                              ),
                            );
                          },
                        );
                      },
                    ),
                  ),

                  if (Platform.isAndroid)
                    _SelectAllButton(
                      filteredAlbums: filteredAlbums,
                      selectedBackupAlbums: selectedBackupAlbums,
                    ),
                ],
              ),
            ),
            SliverLayoutBuilder(
              builder: (context, constraints) {
                if (constraints.crossAxisExtent > 600) {
                  return _AlbumSelectionGrid(
                    filteredAlbums: filteredAlbums,
                    searchQuery: _searchQuery,
                  );
                } else {
                  return _AlbumSelectionList(
                    filteredAlbums: filteredAlbums,
                    searchQuery: _searchQuery,
                  );
                }
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
  final String searchQuery;

  const _AlbumSelectionList({
    required this.filteredAlbums,
    required this.searchQuery,
  });

  @override
  Widget build(BuildContext context) {
    if (filteredAlbums.isEmpty && searchQuery.isNotEmpty) {
      return SliverToBoxAdapter(
        child: Center(
          child: Padding(
            padding: const EdgeInsets.all(24.0),
            child: Text('album_search_not_found'.t(context: context)),
          ),
        ),
      );
    }

    if (filteredAlbums.isEmpty) {
      return const SliverToBoxAdapter(
        child: Center(
          child: CircularProgressIndicator(),
        ),
      );
    }

    return SliverPadding(
      padding: const EdgeInsets.symmetric(vertical: 12.0),
      sliver: SliverList(
        delegate: SliverChildBuilderDelegate(
          ((context, index) {
            return DriftAlbumInfoListTile(
              album: filteredAlbums[index],
            );
          }),
          childCount: filteredAlbums.length,
        ),
      ),
    );
  }
}

class _AlbumSelectionGrid extends StatelessWidget {
  final List<LocalAlbum> filteredAlbums;
  final String searchQuery;

  const _AlbumSelectionGrid({
    required this.filteredAlbums,
    required this.searchQuery,
  });

  @override
  Widget build(BuildContext context) {
    if (filteredAlbums.isEmpty && searchQuery.isNotEmpty) {
      return SliverToBoxAdapter(
        child: Center(
          child: Padding(
            padding: const EdgeInsets.all(24.0),
            child: Text('album_search_not_found'.t(context: context)),
          ),
        ),
      );
    }

    if (filteredAlbums.isEmpty) {
      return const SliverToBoxAdapter(
        child: Center(
          child: CircularProgressIndicator(),
        ),
      );
    }

    return SliverPadding(
      padding: const EdgeInsets.all(12.0),
      sliver: SliverGrid.builder(
        gridDelegate: const SliverGridDelegateWithMaxCrossAxisExtent(
          maxCrossAxisExtent: 300,
          mainAxisSpacing: 12,
          crossAxisSpacing: 12,
        ),
        itemCount: filteredAlbums.length,
        itemBuilder: ((context, index) {
          return DriftAlbumInfoListTile(
            album: filteredAlbums[index],
          );
        }),
      ),
    );
  }
}

class _SelectedAlbumNameChips extends ConsumerWidget {
  final List<LocalAlbum> selectedBackupAlbums;

  const _SelectedAlbumNameChips({
    required this.selectedBackupAlbums,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Wrap(
      children: selectedBackupAlbums.asMap().entries.map((entry) {
        final album = entry.value;

        void removeSelection() {
          ref.read(backupAlbumProvider.notifier).deselectAlbum(album);
        }

        return Padding(
          padding: const EdgeInsets.only(right: 8.0),
          child: GestureDetector(
            onTap: removeSelection,
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
                deleteIcon: const Icon(
                  Icons.cancel_rounded,
                  size: 15,
                ),
                onDeleted: removeSelection,
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

  const _ExcludedAlbumNameChips({
    required this.excludedBackupAlbums,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Wrap(
      children: excludedBackupAlbums.asMap().entries.map((entry) {
        final album = entry.value;

        void removeSelection() {
          ref.read(backupAlbumProvider.notifier).deselectAlbum(album);
        }

        return GestureDetector(
          onTap: removeSelection,
          child: Padding(
            padding: const EdgeInsets.only(right: 8.0),
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 200),
              curve: Curves.easeInOut,
              child: Chip(
                label: Text(
                  album.name,
                  style: TextStyle(
                    fontSize: 12,
                    color: context.scaffoldBackgroundColor,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                backgroundColor: Colors.red[300],
                deleteIconColor: context.scaffoldBackgroundColor,
                deleteIcon: const Icon(
                  Icons.cancel_rounded,
                  size: 15,
                ),
                onDeleted: removeSelection,
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

  const _SelectAllButton({
    required this.filteredAlbums,
    required this.selectedBackupAlbums,
  });

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
                          ref.read(backupAlbumProvider.notifier).selectAlbum(album);
                        }
                      }
                    }
                  : null,
              icon: const Icon(Icons.select_all),
              label: AnimatedSwitcher(
                duration: const Duration(milliseconds: 200),
                child: Text(
                  "select_all".t(context: context),
                ),
              ),
              style: ElevatedButton.styleFrom(
                padding: const EdgeInsets.symmetric(vertical: 12.0),
              ),
            ),
          ),
          const SizedBox(width: 8.0),
          Expanded(
            child: OutlinedButton.icon(
              onPressed: selectedBackupAlbums.isNotEmpty
                  ? () {
                      for (final album in filteredAlbums) {
                        if (album.backupSelection == BackupSelection.selected) {
                          ref.read(backupAlbumProvider.notifier).deselectAlbum(album);
                        }
                      }
                    }
                  : null,
              icon: const Icon(Icons.deselect),
              label: Text('deselect_all'.t(context: context)),
              style: OutlinedButton.styleFrom(
                padding: const EdgeInsets.symmetric(vertical: 12.0),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
