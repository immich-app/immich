import 'package:auto_route/auto_route.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/constants/enums.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/models/folder/recursive_folder.model.dart';
import 'package:immich_mobile/models/folder/root_folder.model.dart';
import 'package:immich_mobile/providers/folder.provider.dart';
import 'package:immich_mobile/routing/router.dart';
import 'package:immich_mobile/utils/bytes_units.dart';
import 'package:immich_mobile/widgets/asset_grid/thumbnail_image.dart';
import 'package:immich_mobile/widgets/common/immich_toast.dart';

RecursiveFolder? _findFolderInStructure(
  RootFolder rootFolder,
  RecursiveFolder targetFolder,
) {
  for (var folder in rootFolder.subfolders) {
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
      var newOrder =
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
              sortOrder: sortOrder.value,
            );
          } else {
            return FolderContent(
              folder: currentFolder.value!,
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
  final SortOrder sortOrder;

  const FolderContent({super.key, this.folder, this.sortOrder = SortOrder.asc});

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

    return folderRenderlist.when(
      data: (list) {
        return ListView(
          children: [
            if (folder!.subfolders.isNotEmpty)
              ...folder!.subfolders.map(
                (subfolder) => ListTile(
                  leading: Icon(Icons.folder, color: context.primaryColor),
                  title: Text(subfolder.name),
                  onTap: () =>
                      context.pushRoute(FolderRoute(folder: subfolder)),
                ),
              ),
            if (!list.isEmpty &&
                list.allAssets != null &&
                list.allAssets!.isNotEmpty)
              ...list.allAssets!.map(
                (asset) => ListTile(
                  onTap: () => context.pushRoute(
                    GalleryViewerRoute(
                      renderList: list,
                      initialIndex: list.allAssets!.indexOf(asset),
                    ),
                  ),
                  leading: SizedBox(
                    // height: 100,
                    width: 80,
                    child: ThumbnailImage(
                      asset: asset,
                      showStorageIndicator: false,
                    ),
                  ),
                  title: Row(
                    children: [
                      Flexible(
                        child: Text(
                          // Remove the file extension from the file name
                          // Sometimes the file name has multiple dots (.TS.mp4)
                          asset.fileName.split('.').first,
                          softWrap: false,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      Text(
                        // Display the file extension(s)
                        ".${asset.fileName.substring(asset.fileName.indexOf('.') + 1)}",
                      ),
                    ],
                  ),
                  subtitle: Text(
                    "${asset.exifInfo?.fileSize != null ? formatBytes(asset.exifInfo?.fileSize ?? 0) : ""} ·  ${DateFormat.yMMMd().format(asset.fileCreatedAt)}",
                  ),
                ),
              ),
            if (folder!.subfolders.isEmpty && list.isEmpty)
              Center(child: const Text("empty_folder").tr()),
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
    );
  }
}
