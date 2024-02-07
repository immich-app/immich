import 'package:auto_route/auto_route.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/modules/album/models/album.model.dart';
import 'package:immich_mobile/modules/album/providers/local_album.provider.dart';
import 'package:immich_mobile/modules/backup/providers/backup.provider.dart';
import 'package:immich_mobile/modules/backup/providers/backup_album.provider.dart';
import 'package:immich_mobile/modules/backup/ui/backup_album_info_list_item.dart';
import 'package:immich_mobile/modules/backup/ui/backup_album_selection_chip.dart';
import 'package:immich_mobile/shared/ui/immich_app_bar.dart';
import 'package:immich_mobile/shared/ui/immich_loading_indicator.dart';

@RoutePage()
class BackupAlbumSelectionPage extends HookConsumerWidget {
  const BackupAlbumSelectionPage({super.key});
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final localAlbums = ref.watch(localAlbumsProvider);
    final searchValue = useValueNotifier('');

    useEffect(
      () {
        ref.read(localAlbumsProvider.notifier).getDeviceAlbums();
        return ref.read(backupProvider.notifier).getBackupInfo;
      },
      [],
    );

    return Scaffold(
      appBar: _AppBar(),
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
                  ).tr(),
                ),

                // Selected Album Chips
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16.0),
                  child: Consumer(
                    builder: (ctx, ref, child) {
                      final backupState = ref.watch(backupAlbumsProvider);
                      return backupState.maybeWhen(
                        orElse: () => const SizedBox.shrink(),
                        data: (data) {
                          final chips = data.selectedBackupAlbums
                              .followedBy(data.excludedBackupAlbums);
                          return Wrap(
                            children: [
                              ...chips.map(
                                (c) => BackupAlbumSelectionChip(backupAlbum: c),
                              ),
                            ],
                          );
                        },
                      );
                    },
                  ),
                ),
                _AlbumBackupInfoRow(localAlbums.valueOrNull?.length ?? 0),
                _AlbumSearchBar(onSearch: (value) => searchValue.value = value),
              ],
            ),
          ),
          ValueListenableBuilder(
            valueListenable: searchValue,
            builder: (ctx, search, _) {
              final filteredAlbums = searchValue.value.isEmpty
                  ? localAlbums
                  : localAlbums.whenData(
                      (albums) => albums
                          .where(
                            (a) => a.name
                                .toLowerCase()
                                .contains(searchValue.value.toLowerCase()),
                          )
                          .toList(),
                    );
              return _SilverLocalAlbumSelectionList(albums: filteredAlbums);
            },
          ),
        ],
      ),
    );
  }
}

class _AppBar extends ImmichAppBar {
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return AppBar(
      leading: IconButton(
        onPressed: () => context.popRoute(),
        icon: const Icon(Icons.arrow_back_ios_rounded),
      ),
      title: const Text(
        "backup_album_selection_page_select_albums",
      ).tr(),
      elevation: 0,
    );
  }
}

class _AlbumBackupInfoRow extends StatelessWidget {
  final int albumCount;

  const _AlbumBackupInfoRow(this.albumCount);

  @override
  Widget build(BuildContext context) {
    void showBackupSelectionInfoDialog() {
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
            ).tr(),
            content: SingleChildScrollView(
              child: ListBody(
                children: [
                  const Text(
                    'backup_album_selection_page_assets_scatter',
                    style: TextStyle(
                      fontSize: 14,
                    ),
                  ).tr(),
                ],
              ),
            ),
          );
        },
      );
    }

    return ListTile(
      title: Text(
        "backup_album_selection_page_albums_device"
            .tr(args: [albumCount.toString()]),
        style: context.textTheme.titleSmall,
      ),
      subtitle: Padding(
        padding: const EdgeInsets.symmetric(vertical: 8.0),
        child: Text(
          "backup_album_selection_page_albums_tap",
          style: context.textTheme.labelLarge?.copyWith(
            color: context.primaryColor,
          ),
        ).tr(),
      ),
      trailing: IconButton(
        splashRadius: 16,
        icon: Icon(
          Icons.info,
          size: 20,
          color: context.primaryColor,
        ),
        onPressed: showBackupSelectionInfoDialog,
      ),
    );
  }
}

class _AlbumSearchBar extends StatelessWidget {
  final Function(String) onSearch;

  const _AlbumSearchBar({required this.onSearch});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(left: 16.0, right: 16, bottom: 8.0),
      child: TextFormField(
        onChanged: onSearch,
        decoration: InputDecoration(
          contentPadding: const EdgeInsets.all(8.0),
          hintText: "Search",
          hintStyle: TextStyle(
            color: context.isDarkTheme ? Colors.white : Colors.grey,
            fontSize: 14.0,
          ),
          prefixIcon: const Icon(
            Icons.search,
            color: Colors.grey,
          ),
          border: const OutlineInputBorder(
            borderRadius: BorderRadius.all(Radius.circular(10)),
            borderSide: BorderSide.none,
          ),
          filled: true,
          fillColor: context.isDarkTheme ? Colors.white30 : Colors.grey[200],
        ),
      ),
    );
  }
}

// ignore: prefer-sliver-prefix
class _SilverLocalAlbumSelectionList extends StatelessWidget {
  final AsyncValue<List<LocalAlbum>> albums;

  const _SilverLocalAlbumSelectionList({required this.albums});

  @override
  Widget build(BuildContext context) {
    if (albums.isLoading) {
      return const SliverToBoxAdapter(
        child: Center(
          child: ImmichLoadingIndicator(),
        ),
      );
    }

    if (albums.hasError) {
      return SliverToBoxAdapter(child: Text("Error occured: ${albums.error}"));
    }

    return SliverPadding(
      padding: const EdgeInsets.all(12.0),
      sliver: context.isMobile
          ? SliverList(
              delegate: SliverChildBuilderDelegate(
                ((context, index) {
                  return BackupAlbumInfoListItem(
                    album: albums.requireValue.elementAt(index),
                  );
                }),
                childCount: albums.requireValue.length,
              ),
            )
          : SliverGrid.builder(
              gridDelegate: const SliverGridDelegateWithMaxCrossAxisExtent(
                maxCrossAxisExtent: 300,
                mainAxisSpacing: 12,
                crossAxisSpacing: 12,
              ),
              itemCount: albums.requireValue.length,
              itemBuilder: ((context, index) {
                return BackupAlbumInfoListItem(
                  album: albums.requireValue.elementAt(index),
                );
              }),
            ),
    );
  }
}
