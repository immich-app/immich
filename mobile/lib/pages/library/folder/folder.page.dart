import 'package:auto_route/auto_route.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/models/folder/root_folder.model.dart';
import 'package:immich_mobile/routing/router.dart';
import 'package:immich_mobile/widgets/common/immich_toast.dart';
import 'package:immich_mobile/models/folder/recursive_folder.model.dart';
import 'package:immich_mobile/providers/folder.provider.dart';

@RoutePage()
class FolderPage extends HookConsumerWidget {
  final RecursiveFolder? folder;

  const FolderPage({super.key, this.folder});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final folderState = ref.watch(folderStructureProvider);

    return Scaffold(
      appBar: AppBar(
        title: Text(folder?.name ?? 'Root'),
        elevation: 0,
        centerTitle: false,
      ),
      body: folderState.when(
        data: (rootFolder) {
          // if folder is null, the root folder is the current folder
          RecursiveFolder? currentFolder = folder == null
              ? null
              : _findFolder(rootFolder, folder!.path, folder!.name);

          if (currentFolder == null && folder != null) {
            return Center(child: const Text("Folder not found").tr());
          } else if (currentFolder == null) {
            // display root folder
            return ListView(
              children: [
                if (rootFolder.subfolders.isNotEmpty)
                  ...rootFolder.subfolders.map(
                    (subfolder) => ListTile(
                      title: Text(subfolder.name),
                      onTap: () =>
                          context.pushRoute(FolderRoute(folder: subfolder)),
                    ),
                  ),
                if (rootFolder.assets != null && rootFolder.assets!.isNotEmpty)
                  ...rootFolder.assets!.map(
                    (asset) => ListTile(
                      title: Text(asset.name),
                      subtitle: Text(asset.fileName),
                    ),
                  ),
                if (rootFolder.subfolders.isEmpty &&
                    (rootFolder.assets == null || rootFolder.assets!.isEmpty))
                  Center(child: const Text("No subfolders or assets").tr()),
              ],
            );
          }

          return ListView(
            children: [
              if (currentFolder.subfolders.isNotEmpty)
                ...currentFolder.subfolders.map(
                  (subfolder) => ListTile(
                    title: Text(subfolder.name),
                    onTap: () =>
                        context.pushRoute(FolderRoute(folder: subfolder)),
                  ),
                ),
              if (currentFolder.assets != null &&
                  currentFolder.assets!.isNotEmpty)
                ...currentFolder.assets!.map(
                  (asset) => ListTile(
                    title: Text(asset.name),
                    subtitle: Text(asset.fileName),
                  ),
                ),
              if (currentFolder.subfolders.isEmpty &&
                  (currentFolder.assets == null ||
                      currentFolder.assets!.isEmpty))
                Center(child: const Text("No subfolders or assets").tr()),
            ],
          );
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

  RecursiveFolder? _findFolder(
    RootFolder rootFolder,
    String path,
    String name,
  ) {
    if ((path == '/' || path.isEmpty) &&
        rootFolder.subfolders.any((f) => f.name == name)) {
      return rootFolder.subfolders.firstWhere((f) => f.name == name);
    }

    for (var subfolder in rootFolder.subfolders) {
      final result = _findFolderRecursive(subfolder, path, name);
      if (result != null) {
        return result;
      }
    }

    return null;
  }

  RecursiveFolder? _findFolderRecursive(
    RecursiveFolder folder,
    String path,
    String name,
  ) {
    if (folder.path == path && folder.name == name) {
      return folder;
    }

    for (var subfolder in folder.subfolders) {
      final result = _findFolderRecursive(subfolder, path, name);
      if (result != null) {
        return result;
      }
    }

    return null;
  }
}
