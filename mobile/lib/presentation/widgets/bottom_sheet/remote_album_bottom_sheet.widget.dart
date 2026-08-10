import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/constants/enums.dart';
import 'package:immich_mobile/domain/models/album/album.model.dart';
import 'package:immich_mobile/extensions/translate_extensions.dart';
import 'package:immich_mobile/presentation/actions/action.widget.dart';
import 'package:immich_mobile/presentation/actions/archive.action.dart';
import 'package:immich_mobile/presentation/actions/asset_debug.action.dart';
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
    final ownsAlbum = ref.watch(currentUserProvider)?.id == widget.album.ownerId;

    Future<void> addToAlbum(RemoteAlbum album) async {
      final result = await ref.read(actionProvider.notifier).addToAlbum(ActionSource.timeline, album);

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
      actions: <ActionColumnButton>[
        const .new(action: AssetDebugAction(source: .timeline)),
        const .new(action: ShareAction(source: .timeline)),
        const .new(action: ShareLinkAction(source: .timeline)),

        if (ownsAlbum) ...const [
          .new(action: ArchiveAction(source: .timeline)),
          .new(action: FavoriteAction(source: .timeline)),
        ],
        const .new(action: DownloadAction(source: .timeline)),
        if (ownsAlbum) ...const [
          .new(action: DeleteAction(source: .timeline)),
          .new(action: EditDateTimeAction(source: .timeline)),
          .new(action: EditLocationAction(source: .timeline)),
          .new(action: LockAction(source: .timeline)),
          .new(action: StackAction(source: .timeline)),
        ],
        const .new(action: CleanupLocalAction(source: .timeline)),
        if (ownsAlbum) ...[
          ActionColumnButton(
            action: RemoveFromAlbumAction(source: .timeline, albumId: widget.album.id),
          ),
          ActionColumnButton(
            action: SetAlbumCoverAction(source: .timeline, albumId: widget.album.id),
          ),
        ],
      ],
      slivers: ownsAlbum
          ? [const AddToAlbumHeader(), AlbumSelector(onAlbumSelected: addToAlbum, onKeyboardExpanded: onKeyboardExpand)]
          : null,
    );
  }
}
