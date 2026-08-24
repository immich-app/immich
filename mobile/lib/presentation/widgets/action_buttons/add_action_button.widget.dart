import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/generated/translations.g.dart';
import 'package:immich_mobile/presentation/actions/action.widget.dart';
import 'package:immich_mobile/presentation/actions/add_to_album.action.dart';
import 'package:immich_mobile/presentation/actions/archive.action.dart';
import 'package:immich_mobile/presentation/actions/lock.action.dart';
import 'package:immich_mobile/presentation/widgets/action_buttons/base_action_button.widget.dart';
import 'package:immich_mobile/providers/asset_viewer/asset_viewer.provider.dart';
import 'package:immich_mobile/providers/user.provider.dart';
import 'package:immich_ui/immich_ui.dart';

class AddActionButton extends ConsumerStatefulWidget {
  const AddActionButton({super.key, this.originalTheme});

  final ThemeData? originalTheme;

  @override
  ConsumerState<AddActionButton> createState() => _AddActionButtonState();
}

class _AddActionButtonState extends ConsumerState<AddActionButton> {
  List<Widget> _buildMenuChildren() {
    final asset = ref.read(assetViewerProvider).currentAsset;
    if (asset == null) {
      return [];
    }

    final user = ref.read(currentUserProvider);
    final isOwner = asset is RemoteAsset && asset.ownerId == user?.id;

    return [
      Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        child: Text(context.t.add_to_bottom_bar, style: context.textTheme.labelMedium),
      ),
      const ActionMenuItem(action: AddToAlbumAction(source: .viewer)),

      if (isOwner) ...[
        const Divider(),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          child: Text(context.t.move_to, style: context.textTheme.labelMedium),
        ),
        const ActionMenuItem(action: ArchiveAction(source: .viewer)),
        const ActionMenuItem(action: LockAction(source: .viewer)),
      ],
    ];
  }

  @override
  Widget build(BuildContext context) {
    final asset = ref.watch(assetViewerProvider.select((s) => s.currentAsset));
    if (asset == null) {
      return const SizedBox.shrink();
    }

    final themeData = widget.originalTheme ?? context.themeData;

    return ImmichMenu(
      consumeOutsideTap: true,
      style: MenuStyle(
        backgroundColor: WidgetStatePropertyAll(themeData.scaffoldBackgroundColor),
        surfaceTintColor: const WidgetStatePropertyAll(Colors.grey),
        elevation: const WidgetStatePropertyAll(4),
        shape: const WidgetStatePropertyAll(
          RoundedRectangleBorder(borderRadius: BorderRadius.all(Radius.circular(12))),
        ),
        padding: const WidgetStatePropertyAll(EdgeInsets.symmetric(vertical: 6)),
      ),
      children: widget.originalTheme != null
          ? [
              Theme(
                data: widget.originalTheme!,
                child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: _buildMenuChildren()),
              ),
            ]
          : _buildMenuChildren(),
      builder: (context, controller, child) {
        return BaseActionButton(
          iconData: Icons.add,
          label: context.t.add_to_bottom_bar,
          onPressed: () => controller.isOpen ? controller.close() : controller.open(),
        );
      },
    );
  }
}
