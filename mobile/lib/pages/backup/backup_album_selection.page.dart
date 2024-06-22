import 'package:auto_route/auto_route.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/providers/backup/backup.provider.dart';
import 'package:immich_mobile/widgets/backup/album_info_card.dart';
import 'package:immich_mobile/widgets/backup/album_info_list_tile.dart';
import 'package:immich_mobile/widgets/common/immich_loading_indicator.dart';

@RoutePage()
class BackupAlbumSelectionPage extends HookConsumerWidget {
  const BackupAlbumSelectionPage({super.key});
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    // final availableAlbums = ref.watch(backupProvider).availableAlbums;
    final selectedBackupAlbums = ref.watch(backupProvider).selectedBackupAlbums;
    final isDarkTheme = context.isDarkTheme;
    final albums = ref.watch(backupProvider).availableAlbums;

    useEffect(
      () {
        ref.watch(backupProvider.notifier).getBackupInfo();
        return null;
      },
      [],
    );

    buildAlbumSelectionList() {
      if (albums.isEmpty) {
        return const SliverToBoxAdapter(
          child: Center(
            child: ImmichLoadingIndicator(),
          ),
        );
      }

      return SliverPadding(
        padding: const EdgeInsets.symmetric(vertical: 12.0),
        sliver: SliverList(
          delegate: SliverChildBuilderDelegate(
            ((context, index) {
              return AlbumInfoListTile(
                album: albums[index],
              );
            }),
            childCount: albums.length,
          ),
        ),
      );
    }

    buildAlbumSelectionGrid() {
      if (albums.isEmpty) {
        return const SliverToBoxAdapter(
          child: Center(
            child: ImmichLoadingIndicator(),
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
          itemCount: albums.length,
          itemBuilder: ((context, index) {
            return AlbumInfoCard(
              album: albums[index],
            );
          }),
        ),
      );
    }

    buildSelectedAlbumNameChip() {
      return selectedBackupAlbums.map((album) {
        void removeSelection() =>
            ref.read(backupProvider.notifier).removeAlbumForBackup(album);

        return Padding(
          padding: const EdgeInsets.only(right: 8.0),
          child: GestureDetector(
            onTap: removeSelection,
            child: Chip(
              label: Text(
                album.name,
                style: TextStyle(
                  fontSize: 12,
                  color: isDarkTheme ? Colors.black : Colors.white,
                  fontWeight: FontWeight.bold,
                ),
              ),
              backgroundColor: context.primaryColor,
              deleteIconColor: isDarkTheme ? Colors.black : Colors.white,
              deleteIcon: const Icon(
                Icons.cancel_rounded,
                size: 15,
              ),
              onDeleted: removeSelection,
            ),
          ),
        );
      }).toSet();
    }

    return Scaffold(
      appBar: AppBar(
        leading: IconButton(
          onPressed: () => context.maybePop(),
          icon: const Icon(Icons.arrow_back_ios_rounded),
        ),
        title: const Text(
          "backup_album_selection_page_select_albums",
        ).tr(),
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
                  ).tr(),
                ),
                // Selected Album Chips

                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16.0),
                  child: Wrap(
                    children: [
                      ...buildSelectedAlbumNameChip(),
                    ],
                  ),
                ),

                ListTile(
                  title: Text(
                    "backup_album_selection_page_albums_device".tr(
                      args: [
                        ref
                            .watch(backupProvider)
                            .availableAlbums
                            .length
                            .toString(),
                      ],
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
                    ).tr(),
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
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(10),
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
                    },
                  ),
                ),

                // buildSearchBar(),
              ],
            ),
          ),
          SliverLayoutBuilder(
            builder: (context, constraints) {
              if (constraints.crossAxisExtent > 600) {
                return buildAlbumSelectionGrid();
              } else {
                return buildAlbumSelectionList();
              }
            },
          ),
        ],
      ),
    );
  }
}
