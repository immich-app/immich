import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/events.model.dart';
import 'package:immich_mobile/domain/utils/event_stream.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/presentation/widgets/action_buttons/base_action_button.widget.dart';
import 'package:immich_mobile/providers/infrastructure/asset_viewer/current_asset.provider.dart';

class ViewerKebabMenu extends ConsumerWidget {
  final VoidCallback onConfigureButtons;

  const ViewerKebabMenu({super.key, required this.onConfigureButtons});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final asset = ref.watch(currentAssetNotifier);
    if (asset == null) {
      return const SizedBox.shrink();
    }

    final theme = context.themeData;
    final menuChildren = <Widget>[
      BaseActionButton(
        label: 'open_bottom_sheet_info'.tr(),
        iconData: Icons.info_outline,
        onPressed: () => EventStream.shared.emit(const ViewerOpenBottomSheetEvent()),
      ),
      const Divider(height: 0),
      BaseActionButton(label: 'reorder_buttons'.tr(), iconData: Icons.tune, onPressed: onConfigureButtons),
    ];

    return MenuAnchor(
      style: MenuStyle(
        backgroundColor: WidgetStatePropertyAll(theme.scaffoldBackgroundColor),
        elevation: const WidgetStatePropertyAll(4),
        shape: const WidgetStatePropertyAll(
          RoundedRectangleBorder(borderRadius: BorderRadius.all(Radius.circular(12))),
        ),
        padding: const WidgetStatePropertyAll(EdgeInsets.symmetric(vertical: 2)),
      ),
      menuChildren: menuChildren,
      builder: (context, controller, child) {
        return IconButton(
          icon: const Icon(Icons.more_vert_rounded),
          onPressed: () {
            if (controller.isOpen) {
              controller.close();
            } else {
              controller.open();
            }
          },
        );
      },
    );
  }
}
