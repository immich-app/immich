import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/presentation/widgets/action_buttons/delete_local_action_button.widget.dart';
import 'package:immich_mobile/presentation/widgets/action_buttons/share_action_button.widget.dart';
import 'package:immich_mobile/presentation/widgets/action_buttons/upload_action_button.widget.dart';
import 'package:immich_mobile/presentation/widgets/bottom_sheet/base_bottom_sheet.widget.dart';

class LocalAlbumBottomSheet extends ConsumerWidget {
  const LocalAlbumBottomSheet({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return const BaseBottomSheet(
      initialChildSize: 0.25,
      maxChildSize: 0.4,
      shouldCloseOnMinExtent: false,
      actions: [
        ShareActionButton(),
        DeleteLocalActionButton(),
        UploadActionButton(),
      ],
    );
  }
}
