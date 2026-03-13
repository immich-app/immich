import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/constants/enums.dart';
import 'package:immich_mobile/presentation/widgets/action_buttons/download_action_button.widget.dart';
import 'package:immich_mobile/presentation/widgets/action_buttons/favorite_action_button.widget.dart';
import 'package:immich_mobile/presentation/widgets/action_buttons/remove_from_space_action_button.widget.dart';
import 'package:immich_mobile/presentation/widgets/action_buttons/share_action_button.widget.dart';
import 'package:immich_mobile/presentation/widgets/bottom_sheet/base_bottom_sheet.widget.dart';
import 'package:immich_mobile/providers/timeline/multiselect.provider.dart';
import 'package:openapi/api.dart';

class SpaceBottomSheet extends ConsumerStatefulWidget {
  final String spaceId;
  final SharedSpaceRole currentUserRole;
  final VoidCallback? onAssetsRemoved;

  const SpaceBottomSheet({super.key, required this.spaceId, required this.currentUserRole, this.onAssetsRemoved});

  @override
  ConsumerState<SpaceBottomSheet> createState() => _SpaceBottomSheetState();
}

class _SpaceBottomSheetState extends ConsumerState<SpaceBottomSheet> {
  late DraggableScrollableController sheetController;

  @override
  void initState() {
    super.initState();
    sheetController = DraggableScrollableController();
  }

  @override
  void dispose() {
    sheetController.dispose();
    super.dispose();
  }

  bool get _canEdit =>
      widget.currentUserRole == SharedSpaceRole.owner || widget.currentUserRole == SharedSpaceRole.editor;

  @override
  Widget build(BuildContext context) {
    final multiselect = ref.watch(multiSelectProvider);

    return BaseBottomSheet(
      controller: sheetController,
      initialChildSize: 0.22,
      minChildSize: 0.22,
      maxChildSize: 0.55,
      shouldCloseOnMinExtent: false,
      actions: [
        const ShareActionButton(source: ActionSource.timeline),
        if (multiselect.hasRemote) ...[
          const DownloadActionButton(source: ActionSource.timeline),
          const FavoriteActionButton(source: ActionSource.timeline),
          if (_canEdit)
            RemoveFromSpaceActionButton(
              source: ActionSource.timeline,
              spaceId: widget.spaceId,
              onComplete: widget.onAssetsRemoved,
            ),
        ],
      ],
    );
  }
}
