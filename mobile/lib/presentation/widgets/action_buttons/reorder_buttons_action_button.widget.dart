import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/presentation/widgets/action_buttons/base_action_button.widget.dart';
import 'package:immich_mobile/presentation/widgets/asset_viewer/asset_viewer.state.dart';
import 'package:immich_mobile/presentation/widgets/asset_viewer/quick_action_configurator.widget.dart';

class ReorderButtonsActionButton extends ConsumerWidget {
  const ReorderButtonsActionButton({super.key, this.originalTheme});

  final ThemeData? originalTheme;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return BaseActionButton(
      label: 'reorder_buttons'.tr(),
      iconData: Icons.swap_vert,
      iconColor: originalTheme?.iconTheme.color,
      menuItem: true,
      onPressed: () async {
        final viewerNotifier = ref.read(assetViewerProvider.notifier);
        viewerNotifier.setBottomSheet(true);

        await showModalBottomSheet<void>(
          context: context,
          isScrollControlled: true,
          enableDrag: false,
          builder: (sheetContext) => const FractionallySizedBox(heightFactor: 0.75, child: QuickActionConfigurator()),
        ).whenComplete(() {
          viewerNotifier.setBottomSheet(false);
        });
      },
    );
  }
}
