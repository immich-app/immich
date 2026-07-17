import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/album/album.model.dart';
import 'package:immich_mobile/presentation/actions/action.widget.dart';
import 'package:immich_mobile/presentation/actions/archive.action.dart';
import 'package:immich_mobile/presentation/actions/asset_debug.action.dart';
import 'package:immich_mobile/presentation/actions/delete.action.dart';
import 'package:immich_mobile/presentation/actions/download.action.dart';
import 'package:immich_mobile/presentation/actions/edit_datetime.action.dart';
import 'package:immich_mobile/presentation/actions/edit_location.action.dart';
import 'package:immich_mobile/presentation/actions/favorite.action.dart';
import 'package:immich_mobile/presentation/actions/lock.action.dart';
import 'package:immich_mobile/presentation/actions/share.action.dart';
import 'package:immich_mobile/presentation/actions/share_link.action.dart';
import 'package:immich_mobile/presentation/actions/stack.action.dart';
import 'package:immich_mobile/presentation/actions/tag.action.dart';
import 'package:immich_mobile/presentation/actions/upload.action.dart';
import 'package:immich_mobile/presentation/widgets/album/album_selector.widget.dart';
import 'package:immich_mobile/presentation/widgets/bottom_sheet/base_bottom_sheet.widget.dart';
import 'package:immich_mobile/providers/infrastructure/action.provider.dart';
import 'package:immich_mobile/widgets/common/immich_toast.dart';

class GeneralBottomSheet extends ConsumerStatefulWidget {
  final double? minChildSize;
  const GeneralBottomSheet({super.key, this.minChildSize});

  @override
  ConsumerState<GeneralBottomSheet> createState() => _GeneralBottomSheetState();
}

class _GeneralBottomSheetState extends ConsumerState<GeneralBottomSheet> {
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

  @override
  Widget build(BuildContext context) {
    Future<void> addToAlbum(RemoteAlbum album) async {
      final result = await ref.read(actionProvider.notifier).addToAlbum(.timeline, album);

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
      initialChildSize: widget.minChildSize ?? 0.15,
      minChildSize: widget.minChildSize,
      maxChildSize: 0.85,
      shouldCloseOnMinExtent: false,
      actions: const [
        ActionColumnButtonWidget(source: .timeline, action: ShareAction()),
        ActionColumnButtonWidget(source: .timeline, action: ShareLinkAction()),
        TimelineSheetActionWidget(action: AssetDebugAction()),
        TimelineSheetActionWidget(action: FavoriteAction()),
        TimelineSheetActionWidget(action: UnfavoriteAction()),
        TimelineSheetActionWidget(action: ArchiveAction()),
        TimelineSheetActionWidget(action: UnarchiveAction()),
        TimelineSheetActionWidget(action: TrashAction()),
        TimelineSheetActionWidget(action: DeletePermanentlyAction()),
        TimelineSheetActionWidget(action: DeleteLocalAction()),
        TimelineSheetActionWidget(action: CleanupLocalAction()),
        TimelineSheetActionWidget(action: StackAction()),
        TimelineSheetActionWidget(action: UnstackAction()),
        TimelineSheetActionWidget(action: LockAction()),
        TimelineSheetActionWidget(action: UnlockAction()),
        TimelineSheetActionWidget(action: EditDateTimeAction()),
        TimelineSheetActionWidget(action: EditLocationAction()),
        TimelineSheetActionWidget(action: DownloadAction()),
        TimelineSheetActionWidget(action: TagAction()),
        TimelineSheetActionWidget(action: UploadAction(source: .timeline)),
      ],
      slivers: [
        const AddToAlbumHeader(),
        AlbumSelector(onAlbumSelected: addToAlbum, onKeyboardExpanded: onKeyboardExpand),
      ],
    );
  }
}
