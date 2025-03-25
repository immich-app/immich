import 'package:auto_route/auto_route.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/constants/enums.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/extensions/theme_extensions.dart';
import 'package:immich_mobile/models/folder/recursive_folder.model.dart';
import 'package:immich_mobile/models/folder/root_folder.model.dart';
import 'package:immich_mobile/pages/common/large_leading_tile.dart';
import 'package:immich_mobile/providers/folder.provider.dart';
import 'package:immich_mobile/routing/router.dart';
import 'package:immich_mobile/utils/bytes_units.dart';
import 'package:immich_mobile/widgets/asset_grid/thumbnail_image.dart';
import 'package:immich_mobile/widgets/common/immich_toast.dart';

RecursiveFolder? _findFolderInStructure(
  RootFolder rootFolder,
  RecursiveFolder targetFolder,
) {
  for (final folder in rootFolder.subfolders) {
    if (targetFolder.path == '/' &&
        folder.path.isEmpty &&
        folder.name == targetFolder.name) {
      return folder;
    }

    if (folder.path == targetFolder.path && folder.name == targetFolder.name) {
      return folder;
    }

    if (folder.subfolders.isNotEmpty) {
      final found = _findFolderInStructure(folder, targetFolder);
      if (found != null) return found;
    }
  }
  return null;
}

@RoutePage()
class FolderPage extends HookConsumerWidget {
  final RecursiveFolder? folder;

  const FolderPage({super.key, this.folder});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final folderState = ref.watch(folderStructureProvider);
    final currentFolder = useState<RecursiveFolder?>(folder);
    final sortOrder = useState<SortOrder>(SortOrder.asc);

    useEffect(
      () {
        if (folder == null) {
          ref
              .read(folderStructureProvider.notifier)
              .fetchFolders(sortOrder.value);
        }
        return null;
      },
      [],
    );

    // Update current folder when root structure changes
    useEffect(
      () {
        if (folder != null && folderState.hasValue) {
          final updatedFolder =
              _findFolderInStructure(folderState.value!, folder!);
          if (updatedFolder != null) {
            currentFolder.value = updatedFolder;
          }
        }
        return null;
      },
      [folderState],
    );

    void onToggleSortOrder() {
      final newOrder =
          sortOrder.value == SortOrder.asc ? SortOrder.desc : SortOrder.asc;

      ref.read(folderStructureProvider.notifier).fetchFolders(newOrder);

      sortOrder.value = newOrder;
    }

    return Scaffold(
      appBar: AppBar(
        title: Text(currentFolder.value?.name ?? tr("folders")),
        elevation: 0,
        centerTitle: false,
        actions: [
          IconButton(
            icon: const Icon(Icons.swap_vert),
            onPressed: onToggleSortOrder,
          ),
        ],
      ),
      body: folderState.when(
        data: (rootFolder) {
          if (folder == null) {
            return FolderContent(
              folder: rootFolder,
              root: rootFolder,
              sortOrder: sortOrder.value,
            );
          } else {
            return FolderContent(
              folder: currentFolder.value!,
              root: rootFolder,
              sortOrder: sortOrder.value,
            );
          }
        },
        loading: () => const Center(
          child: CircularProgressIndicator(),
        ),
        error: (error, stack) {
          ImmichToast.show(
            context: context,
            msg: "failed_to_load_folder".tr(),
            toastType: ToastType.error,
          );
          return Center(child: const Text("failed_to_load_folder").tr());
        },
      ),
    );
  }
}

class FolderContent extends HookConsumerWidget {
  final RootFolder? folder;
  final RootFolder root;
  final SortOrder sortOrder;

  const FolderContent({
    super.key,
    this.folder,
    required this.root,
    this.sortOrder = SortOrder.asc,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final folderRenderlist = ref.watch(folderRenderListProvider(folder!));

    // Initial asset fetch
    useEffect(
      () {
        if (folder == null) return;
        ref
            .read(folderRenderListProvider(folder!).notifier)
            .fetchAssets(sortOrder);
        return null;
      },
      [folder],
    );

    if (folder == null) {
      return Center(child: const Text("folder_not_found").tr());
    }

    getSubtitle(int subFolderCount) {
      if (subFolderCount > 0) {
        return "$subFolderCount ${tr("folders")}".toLowerCase();
      }

      if (subFolderCount == 1) {
        return "1 ${tr("folder")}".toLowerCase();
      }

      return "";
    }

    return Column(
      children: [
        FolderPath(currentFolder: folder!, root: root),
        Expanded(
          child: folderRenderlist.when(
            data: (list) {
              if (folder!.subfolders.isEmpty && list.isEmpty) {
                return Center(child: const Text("empty_folder").tr());
              }

              return ListView(
                children: [
                  if (folder!.subfolders.isNotEmpty)
                    ...folder!.subfolders.map(
                      (subfolder) => LargeLeadingTile(
                        leading: Icon(
                          Icons.folder,
                          color: context.primaryColor,
                          size: 48,
                        ),
                        title: Text(
                          subfolder.name,
                          softWrap: false,
                          overflow: TextOverflow.ellipsis,
                          style: context.textTheme.titleSmall?.copyWith(
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                        subtitle: subfolder.subfolders.isNotEmpty
                            ? Text(
                                getSubtitle(subfolder.subfolders.length),
                                style: context.textTheme.bodyMedium?.copyWith(
                                  color: context.colorScheme.onSurfaceSecondary,
                                ),
                              )
                            : null,
                        onTap: () =>
                            context.pushRoute(FolderRoute(folder: subfolder)),
                      ),
                    ),
                  if (!list.isEmpty &&
                      list.allAssets != null &&
                      list.allAssets!.isNotEmpty)
                    ...list.allAssets!.map(
                      (asset) => LargeLeadingTile(
                        onTap: () => context.pushRoute(
                          GalleryViewerRoute(
                            renderList: list,
                            initialIndex: list.allAssets!.indexOf(asset),
                          ),
                        ),
                        leading: ClipRRect(
                          borderRadius: const BorderRadius.all(
                            Radius.circular(15),
                          ),
                          child: SizedBox(
                            width: 80,
                            height: 80,
                            child: ThumbnailImage(
                              asset: asset,
                              showStorageIndicator: false,
                            ),
                          ),
                        ),
                        title: Text(
                          asset.fileName,
                          maxLines: 2,
                          softWrap: false,
                          overflow: TextOverflow.ellipsis,
                          style: context.textTheme.titleSmall?.copyWith(
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                        subtitle: Text(
                          "${asset.exifInfo?.fileSize != null ? formatBytes(asset.exifInfo?.fileSize ?? 0) : ""} • ${DateFormat.yMMMd().format(asset.fileCreatedAt)}",
                          style: context.textTheme.bodyMedium?.copyWith(
                            color: context.colorScheme.onSurfaceSecondary,
                          ),
                        ),
                      ),
                    ),
                ],
              );
            },
            loading: () => const Center(
              child: CircularProgressIndicator(),
            ),
            error: (error, stack) {
              ImmichToast.show(
                context: context,
                msg: "failed_to_load_assets".tr(),
                toastType: ToastType.error,
              );
              return Center(child: const Text("failed_to_load_assets").tr());
            },
          ),
        ),
      ],
    );
  }
}

class FolderPath extends StatelessWidget {
  final RootFolder currentFolder;
  final RootFolder root;

  const FolderPath({
    super.key,
    required this.currentFolder,
    required this.root,
  });

  @override
  Widget build(BuildContext context) {
    if (currentFolder.path.isEmpty || currentFolder.path == '/') {
      return const SizedBox.shrink();
    }

    return Container(
      width: double.infinity,
      alignment: Alignment.centerLeft,
      child: SingleChildScrollView(
        scrollDirection: Axis.horizontal,
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.start,
            children: [
              Text(
                currentFolder.path,
                style: TextStyle(
                  fontFamily: 'Inconsolata',
                  fontWeight: FontWeight.bold,
                  fontSize: 14,
                  color: context.colorScheme.onSurface.withAlpha(175),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
