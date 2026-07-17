import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/album/album.model.dart';
import 'package:immich_mobile/extensions/translate_extensions.dart';
import 'package:immich_mobile/presentation/actions/action.widget.dart';
import 'package:immich_mobile/presentation/actions/archive.action.dart';
import 'package:immich_mobile/presentation/actions/delete.action.dart';
import 'package:immich_mobile/presentation/actions/download.action.dart';
import 'package:immich_mobile/presentation/actions/edit_datetime.action.dart';
import 'package:immich_mobile/presentation/actions/edit_location.action.dart';
import 'package:immich_mobile/presentation/actions/favorite.action.dart';
import 'package:immich_mobile/presentation/actions/lock.action.dart';
import 'package:immich_mobile/presentation/actions/remove_from_album.action.dart';
import 'package:immich_mobile/presentation/actions/set_album_cover.action.dart';
import 'package:immich_mobile/presentation/actions/share.action.dart';
import 'package:immich_mobile/presentation/actions/share_link.action.dart';
import 'package:immich_mobile/presentation/actions/stack.action.dart';
import 'package:immich_mobile/presentation/widgets/album/album_selector.widget.dart';
import 'package:immich_mobile/presentation/widgets/bottom_sheet/base_bottom_sheet.widget.dart';
import 'package:immich_mobile/providers/infrastructure/action.provider.dart';
import 'package:immich_mobile/providers/timeline/multiselect.provider.dart';
import 'package:immich_mobile/providers/user.provider.dart';
import 'package:immich_mobile/widgets/common/immich_toast.dart';

class RemoteAlbumBottomSheet extends ConsumerStatefulWidget {
  final RemoteAlbum album;
  const RemoteAlbumBottomSheet({super.key, required this.album});

  @override
  ConsumerState<RemoteAlbumBottomSheet> createState() => _RemoteAlbumBottomSheetState();
}

class _RemoteAlbumBottomSheetState extends ConsumerState<RemoteAlbumBottomSheet> {
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
    final multiselect = ref.watch(multiSelectProvider);
    final ownsAlbum = ref.watch(currentUserProvider)?.id == widget.album.ownerId;

    Future<void> addToAlbum(RemoteAlbum album) async {
      final result = await ref.read(actionProvider.notifier).addToAlbum(.timeline, album);

      if (!context.mounted) {
        return;
      }

      if (!result.success) {
        ImmichToast.show(
          context: context,
          msg: 'scaffold_body_error_occurred'.t(context: context),
          toastType: ToastType.error,
        );
        return;
      }

      ImmichToast.show(
        context: context,
        msg: result.count == 0
            ? 'add_to_album_bottom_sheet_already_exists'.t(context: context, args: {"album": album.name})
            : 'add_to_album_bottom_sheet_added'.t(context: context, args: {"album": album.name}),
      );
    }

    Future<void> onKeyboardExpand() {
      return sheetController.animateTo(0.85, duration: const Duration(milliseconds: 200), curve: Curves.easeInOut);
    }

    return BaseBottomSheet(
      controller: sheetController,
      initialChildSize: 0.22,
      minChildSize: 0.22,
      maxChildSize: 0.85,
      shouldCloseOnMinExtent: false,
      actions: [
        const ActionColumnButtonWidget(source: .timeline, action: ShareAction()),
        const ActionColumnButtonWidget(source: .timeline, action: ShareLinkAction()),
        if (ownsAlbum) ...const <TimelineSheetActionWidget>[
          .new(action: FavoriteAction()),
          .new(action: UnfavoriteAction()),
          .new(action: ArchiveAction()),
          .new(action: UnarchiveAction()),
          .new(action: TrashAction()),
          .new(action: DeletePermanentlyAction()),
          .new(action: DeleteLocalAction()),
          .new(action: StackAction()),
          .new(action: UnstackAction()),
          .new(action: LockAction()),
          .new(action: UnlockAction()),
          .new(action: EditDateTimeAction()),
          .new(action: EditLocationAction()),
        ],
        const TimelineSheetActionWidget(action: DownloadAction()),
        const TimelineSheetActionWidget(action: CleanupLocalAction()),
        if (ownsAlbum) TimelineSheetActionWidget(action: RemoveFromAlbumAction(albumId: widget.album.id)),
        if (ownsAlbum && multiselect.selectedAssets.length == 1)
          TimelineSheetActionWidget(action: SetAlbumCoverAction(albumId: widget.album.id)),
      ],
      slivers: ownsAlbum
          ? [const AddToAlbumHeader(), AlbumSelector(onAlbumSelected: addToAlbum, onKeyboardExpanded: onKeyboardExpand)]
          : null,
    );
  }
}
