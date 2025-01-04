import 'package:auto_route/auto_route.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/entities/asset.entity.dart';
import 'package:immich_mobile/models/folder/root_folder.model.dart';
import 'package:immich_mobile/routing/router.dart';
import 'package:immich_mobile/widgets/common/immich_toast.dart';
import 'package:immich_mobile/models/folder/recursive_folder.model.dart';
import 'package:immich_mobile/providers/folder.provider.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';

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
  final List<Asset>? assets;

  const FolderContent({super.key, this.folder, this.assets});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    if (folder == null) {
      return Center(child: const Text("Folder not found").tr());
    }

    final folderAssetsState = ref.watch(folderAssetsProvider(folder!));

    return folderAssetsState.when(
      data: (assets) {
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
            if (assets.isNotEmpty)
              ...assets.map(
                (asset) => ListTile(
                  title: Text(asset.name),
                  subtitle: Text(asset.fileName),
                ),
              ),
            if (folder!.subfolders.isEmpty && assets.isEmpty)
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
