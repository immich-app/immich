import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/extensions/translate_extensions.dart';
import 'package:immich_mobile/presentation/pages/editing/drift_edit.page.dart';
import 'package:immich_mobile/presentation/widgets/action_buttons/base_action_button.widget.dart';
import 'package:immich_mobile/presentation/widgets/images/image_provider.dart';
import 'package:immich_mobile/providers/infrastructure/asset_viewer/current_asset.provider.dart';

class EditImageActionButton extends ConsumerWidget {
  const EditImageActionButton({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final currentAsset = ref.watch(currentAssetNotifier);

    onPress() {
      if (currentAsset == null) {
        return;
      }

      final image = Image(image: getFullImageProvider(currentAsset));

      context.navigator.push(
        MaterialPageRoute(
          builder: (context) => DriftEditImagePage(asset: currentAsset, image: image, isEdited: false),
        ),
      );
    }

    return BaseActionButton(
      iconData: Icons.tune,
      label: "edit".t(context: context),
      onPressed: onPress,
    );
  }
}
