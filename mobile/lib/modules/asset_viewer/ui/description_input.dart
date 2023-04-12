import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/modules/asset_viewer/providers/asset_description.provider.dart';
import 'package:immich_mobile/shared/models/asset.dart';
import 'package:immich_mobile/shared/ui/immich_toast.dart';
import 'package:logging/logging.dart';

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
    final focusNode = useFocusNode();
    final isFocus = useState(false);
    final isTextEmpty = useState(controller.text.isEmpty);
    final descriptionProvider = ref.watch(assetDescriptionProvider);

    getLatestDescription() async {
      if (asset.exifInfo != null && asset.remoteId != null) {
        final exifId = asset.exifInfo?.id;
        if (exifId != null) {
          controller.text =
              await descriptionProvider.readLatest(asset.remoteId!, exifId);
        }
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
        if (asset.exifInfo != null && asset.remoteId != null) {
          final exifId = asset.exifInfo?.id;
          if (exifId != null) {
            descriptionProvider.setDescription(
              description,
              asset.remoteId!,
              exifId,
            );
          }
        }
      } catch (error, stack) {
        _log.severe("Error updating description $error", error, stack);
        ImmichToast.show(
          context: context,
          msg: "Error updating description, check the log for more details",
          toastType: ToastType.error,
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
