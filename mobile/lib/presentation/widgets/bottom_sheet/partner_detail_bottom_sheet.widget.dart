import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/constants/enums.dart';
import 'package:immich_mobile/domain/models/album/album.model.dart';
import 'package:immich_mobile/presentation/widgets/action_buttons/download_action_button.widget.dart';
import 'package:immich_mobile/presentation/widgets/action_buttons/share_action_button.widget.dart';
import 'package:immich_mobile/presentation/widgets/album/album_selector.widget.dart';
import 'package:immich_mobile/presentation/widgets/bottom_sheet/base_bottom_sheet.widget.dart';
import 'package:immich_mobile/providers/infrastructure/action.provider.dart';
import 'package:immich_mobile/widgets/common/immich_toast.dart';

class PartnerDetailBottomSheet extends ConsumerStatefulWidget {
  const PartnerDetailBottomSheet({super.key});

  @override
  ConsumerState<PartnerDetailBottomSheet> createState() => _PartnerDetailBottomSheetState();
}

class _PartnerDetailBottomSheetState extends ConsumerState<PartnerDetailBottomSheet> {
  late final DraggableScrollableController sheetController;

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

  @override
  Widget build(BuildContext context) {
    Future<void> addToAlbum(RemoteAlbum album) async {
      final result = await ref.read(actionProvider.notifier).addToAlbum(ActionSource.timeline, album);

      if (!context.mounted) {
        return;
      }

      if (!result.success) {
        ImmichToast.show(context: context, msg: 'scaffold_body_error_occurred'.tr(), toastType: ToastType.error);
        return;
      }

      ImmichToast.show(
        context: context,
        msg: result.count == 0
            ? 'add_to_album_bottom_sheet_already_exists'.tr(namedArgs: {'album': album.name})
            : 'add_to_album_bottom_sheet_added'.tr(namedArgs: {'album': album.name}),
      );
    }

    Future<void> onKeyboardExpand() {
      return sheetController.animateTo(0.85, duration: const Duration(milliseconds: 200), curve: Curves.easeInOut);
    }

    return BaseBottomSheet(
      controller: sheetController,
      initialChildSize: 0.25,
      maxChildSize: 0.85,
      shouldCloseOnMinExtent: false,
      actions: const [
        ShareActionButton(source: ActionSource.timeline),
        DownloadActionButton(source: ActionSource.timeline),
      ],
      slivers: [
        const AddToAlbumHeader(),
        AlbumSelector(onAlbumSelected: addToAlbum, onKeyboardExpanded: onKeyboardExpand),
      ],
    );
  }
}
