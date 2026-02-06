import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/constants/enums.dart';
import 'package:immich_mobile/extensions/translate_extensions.dart';
import 'package:immich_mobile/presentation/widgets/action_buttons/base_action_button.widget.dart';
import 'package:immich_mobile/presentation/widgets/bottom_sheet/move_to_album_bottom_sheet.widget.dart';
import 'package:immich_mobile/providers/timeline/multiselect.provider.dart';

class MoveToAlbumActionButton extends ConsumerWidget {
  final String? sourceAlbumId;
  final ActionSource source;
  final bool iconOnly;

  const MoveToAlbumActionButton({super.key, this.sourceAlbumId, required this.source, this.iconOnly = false});

  void _onTap(BuildContext context, WidgetRef ref) {
    if (!context.mounted) return;

    final selectedAssets = ref.read(multiSelectProvider).selectedAssets;
    if (selectedAssets.isEmpty) return;

    showModalBottomSheet(
      elevation: 0,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.all(Radius.circular(15.0))),
      context: context,
      builder: (BuildContext _) {
        return MoveToAlbumBottomSheet(
          assets: selectedAssets,
          sourceAlbumId: sourceAlbumId,
          onMoveSuccess: () {
            ref.read(multiSelectProvider.notifier).reset();
          },
        );
      },
    );
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return BaseActionButton(
      iconData: Icons.drive_file_move_outline,
      label: "move_to_album".t(context: context),
      iconOnly: iconOnly,
      onPressed: () => _onTap(context, ref),
      maxWidth: 100,
    );
  }
}
