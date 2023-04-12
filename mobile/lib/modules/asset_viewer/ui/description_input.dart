import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/shared/models/asset.dart';
import 'package:immich_mobile/shared/models/exif_info.dart';
import 'package:immich_mobile/shared/providers/api.provider.dart';
import 'package:immich_mobile/shared/providers/db.provider.dart';
import 'package:logging/logging.dart';
import 'package:openapi/api.dart';

class DescriptionInput extends HookConsumerWidget {
  DescriptionInput({
    super.key,
    required this.asset,
  });

  final Asset asset;
  final Logger _log = Logger('DescriptionInput');

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isDarkTheme = Theme.of(context).brightness == Brightness.dark;
    final textColor = isDarkTheme ? Colors.white : Colors.black;
    final controller = useTextEditingController();
    final db = ref.watch(dbProvider);
    final focusNode = useFocusNode();
    final isFocus = useState(false);
    final isTextEmpty = useState(controller.text.isEmpty);

    getLatestDescription() async {
      final latestAssetFromServer = await ref
          .watch(apiServiceProvider)
          .assetApi
          .getAssetById(asset.remoteId!);

      final localExifId = asset.exifInfo?.id;
      if (localExifId == null) {
        return;
      }

      final localExifInfo = await db.exifInfos.get(localExifId);

      if (latestAssetFromServer != null && localExifInfo != null) {
        controller.text = latestAssetFromServer.exifInfo?.description ?? '';
        localExifInfo.description = latestAssetFromServer.exifInfo!.description;

        await db.writeTxn(
          () => db.exifInfos.put(localExifInfo),
        );
      }
    }

    useEffect(
      () {
        getLatestDescription();
        return null;
      },
      [],
    );

    submitDescription(String description) async {
      try {
        var result = await ref.watch(apiServiceProvider).assetApi.updateAsset(
              asset.remoteId!,
              UpdateAssetDto(description: description),
            );

        if (result?.exifInfo?.description != null) {
          controller.text = result!.exifInfo!.description!;
          var exifInfo = await db.exifInfos.get(asset.exifInfo!.id!);

          if (exifInfo != null) {
            exifInfo.description = result.exifInfo!.description;
            await db.writeTxn(
              () => db.exifInfos.put(exifInfo),
            );
          }
        }
      } catch (e) {
        _log.severe("Error updating description", e);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text(
              'Failed to update description! Check log for more details',
            ),
          ),
        );
      }
    }

    return TextField(
      focusNode: focusNode,
      onTap: () => isFocus.value = true,
      onChanged: (value) {
        isTextEmpty.value = false;
      },
      onTapOutside: (a) async {
        isFocus.value = false;
        focusNode.unfocus();
        await submitDescription(controller.text);
      },
      maxLines: null,
      keyboardType: TextInputType.multiline,
      controller: controller,
      style: const TextStyle(
        fontSize: 14,
      ),
      decoration: InputDecoration(
        hintText: 'Add description...',
        border: InputBorder.none,
        hintStyle: TextStyle(
          fontWeight: FontWeight.normal,
          fontSize: 12,
          color: textColor.withOpacity(0.5),
        ),
        suffixIcon: !isTextEmpty.value && isFocus.value
            ? IconButton(
                onPressed: () {
                  controller.clear();
                  isTextEmpty.value = true;
                },
                icon: Icon(
                  Icons.cancel_rounded,
                  color: Colors.grey[500],
                ),
                splashRadius: 10,
              )
            : null,
      ),
    );
  }
}
