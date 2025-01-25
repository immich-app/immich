import 'package:auto_route/auto_route.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/models/folder/recursive_folder.model.dart';
import 'package:immich_mobile/models/folder/root_folder.model.dart';
import 'package:immich_mobile/providers/folder.provider.dart';
import 'package:immich_mobile/routing/router.dart';
import 'package:immich_mobile/utils/bytes_units.dart';
import 'package:immich_mobile/widgets/asset_grid/thumbnail_image.dart';
import 'package:immich_mobile/widgets/common/immich_toast.dart';

@RoutePage()
class FolderPage extends HookConsumerWidget {
  final RecursiveFolder? folder;

  const FolderPage({super.key, this.folder});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final folderState = ref.watch(folderStructureProvider);
    useEffect(
      () {
        if (folder == null) {
          ref.read(folderStructureProvider.notifier).fetchFolders();
        }
        return null;
      },
      [],
    );

    void onToggleSortOrder() {
      if (folder != null) {
        ref.read(folderRenderListProvider(folder!).notifier).toggleSortOrder();
      }
      ref.read(folderStructureProvider.notifier).toggleSortOrder();
    }

    return Scaffold(
      appBar: AppBar(
        title: Text(folder?.name ?? 'Root'),
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
            return FolderContent(folder: rootFolder);
          } else {
            return FolderContent(folder: folder!);
          }
        },
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, stack) {
          ImmichToast.show(
            context: context,
            msg: "Failed to load folder".tr(),
            toastType: ToastType.error,
          );
          return Center(child: const Text("Failed to load folder").tr());
        },
      ),
    );
  }
}

class FolderContent extends HookConsumerWidget {
  final RootFolder? folder;

  const FolderContent({super.key, this.folder});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    if (folder == null) {
      return Center(child: const Text("Folder not found").tr());
    }

    final folderRenderlist = ref.watch(folderRenderListProvider(folder!));
    useEffect(
      () {
        ref.read(folderRenderListProvider(folder!).notifier).fetchAssets();
        return null;
      },
      [folder],
    );

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
              Center(child: const Text("No subfolders or assets").tr()),
          ],
        );
      },
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (error, stack) {
        ImmichToast.show(
          context: context,
          msg: "Failed to load assets".tr(),
          toastType: ToastType.error,
        );
        return Center(child: const Text("Failed to load assets").tr());
      },
    );
  }
}
