import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/providers/backup/exp_backup.provider.dart';

class CurrentUploadingAssetInfoBox extends ConsumerWidget {
  const CurrentUploadingAssetInfoBox({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final uploadItems =
        ref.watch(expBackupProvider.select((state) => state.uploadItems));

    return Column(
      children: [
        if (uploadItems.isNotEmpty)
          Container(
            constraints: const BoxConstraints(maxHeight: 200),
            child: ListView.builder(
              shrinkWrap: true,
              itemCount: uploadItems.length,
              itemBuilder: (context, index) {
                final uploadItem = uploadItems.values.elementAt(index);
                return ListTile(
                  dense: true,
                  leading: CircularProgressIndicator(
                    value: uploadItem.progress,
                    strokeWidth: 2,
                  ),
                  title: Text(
                    uploadItem.filename,
                    style: context.textTheme.bodySmall,
                    overflow: TextOverflow.ellipsis,
                  ),
                  trailing: Text(
                    '${(uploadItem.progress * 100).toInt()}%',
                    style: context.textTheme.bodySmall,
                  ),
                );
              },
            ),
          ),
      ],
    );
  }
}
