import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/shared/providers/asset.provider.dart';
import 'package:immich_mobile/modules/home/providers/home_page_state.provider.dart';

class DeleteDialog extends ConsumerWidget {
  const DeleteDialog({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final homePageState = ref.watch(homePageStateProvider);

    return AlertDialog(
      backgroundColor: Colors.grey[200],
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
      title: const Text("Delete Permanently"),
      content: const Text("These items will be permanently deleted from Immich and from your device"),
      actions: [
        TextButton(
          onPressed: () {
            Navigator.of(context).pop();
          },
          child: const Text(
            "Cancel",
            style: TextStyle(color: Colors.blueGrey),
          ),
        ),
        TextButton(
          onPressed: () {
            ref.watch(assetProvider.notifier).deleteAssets(homePageState.selectedItems);
            ref.watch(homePageStateProvider.notifier).disableMultiSelect();

            Navigator.of(context).pop();
          },
          child: Text(
            "Delete",
            style: TextStyle(color: Colors.red[400]),
          ),
        ),
      ],
    );
  }
}
