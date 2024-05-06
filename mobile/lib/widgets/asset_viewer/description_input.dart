import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/providers/asset_viewer/asset_description.provider.dart';
import 'package:immich_mobile/entities/asset.entity.dart';
import 'package:immich_mobile/providers/user.provider.dart';
import 'package:immich_mobile/widgets/common/immich_toast.dart';
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
    final textColor = context.isDarkTheme ? Colors.white : Colors.black;
    final controller = useTextEditingController();
    final focusNode = useFocusNode();
    final isFocus = useState(false);
    final isTextEmpty = useState(controller.text.isEmpty);
    final descriptionProvider =
        ref.watch(assetDescriptionProvider(asset).notifier);
    final description = ref.watch(assetDescriptionProvider(asset));
    final owner = ref.watch(currentUserProvider);
    final hasError = useState(false);

    useEffect(
      () {
        controller.text = description;
        isTextEmpty.value = description.isEmpty;
        return null;
      },
      [description],
    );

    submitDescription(String description) async {
      hasError.value = false;
      try {
        await descriptionProvider.setDescription(
          description,
        );
      } catch (error, stack) {
        hasError.value = true;
        _log.severe("Error updating description", error, stack);
        ImmichToast.show(
          context: context,
          msg: "description_input_submit_error".tr(),
          toastType: ToastType.error,
        );
      }
    }

    Widget? suffixIcon;
    if (hasError.value) {
      suffixIcon = const Icon(Icons.warning_outlined);
    } else if (!isTextEmpty.value && isFocus.value) {
      suffixIcon = IconButton(
        onPressed: () {
          controller.clear();
          isTextEmpty.value = true;
        },
        icon: Icon(
          Icons.cancel_rounded,
          color: Colors.grey[500],
        ),
        splashRadius: 10,
      );
    }

    return TextField(
      enabled: owner?.isarId == asset.ownerId,
      focusNode: focusNode,
      onTap: () => isFocus.value = true,
      onChanged: (value) {
        isTextEmpty.value = false;
      },
      onTapOutside: (a) async {
        isFocus.value = false;
        focusNode.unfocus();

        if (description != controller.text) {
          await submitDescription(controller.text);
        }
      },
      autofocus: false,
      maxLines: null,
      keyboardType: TextInputType.multiline,
      controller: controller,
      style: context.textTheme.labelLarge,
      decoration: InputDecoration(
        hintText: 'description_input_hint_text'.tr(),
        border: InputBorder.none,
        hintStyle: context.textTheme.labelLarge?.copyWith(
          color: textColor.withOpacity(0.5),
        ),
        suffixIcon: suffixIcon,
      ),
    );
  }
}
