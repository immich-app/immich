import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/constants/enums.dart';
import 'package:immich_mobile/domain/models/album/album.model.dart';
import 'package:immich_mobile/generated/translations.g.dart';
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
      final result = await ref.read(actionProvider.notifier).addToAlbum(ActionSource.timeline, album);

      if (!context.mounted) {
        return;
      }

      if (!result.success) {
        ImmichToast.show(context: context, msg: context.t.scaffold_body_error_occurred, toastType: ToastType.error);
        return;
      }
      ImmichToast.show(
        context: context,
        msg: result.count == 0
            ? context.t.add_to_album_bottom_sheet_already_exists(album: album.name)
            : context.t.add_to_album_bottom_sheet_added(album: album.name),
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
      actions: const <ActionColumnButton>[
        .new(action: AssetDebugAction(source: .timeline)),
        .new(action: ShareAction(source: .timeline)),
        .new(action: ShareLinkAction(source: .timeline)),
        .new(action: DownloadAction(source: .timeline)),
        .new(action: DeleteAction(source: .timeline)),
        .new(action: FavoriteAction(source: .timeline)),
        .new(action: ArchiveAction(source: .timeline)),
        .new(action: TagAction(source: .timeline)),
        .new(action: EditDateTimeAction(source: .timeline)),
        .new(action: EditLocationAction(source: .timeline)),
        .new(action: LockAction(source: .timeline)),
        .new(action: StackAction(source: .timeline)),
        .new(action: CleanupLocalAction(source: .timeline)),
        .new(action: UploadAction(source: .timeline)),
      ],
      slivers: [
        const AddToAlbumHeader(),
        AlbumSelector(onAlbumSelected: addToAlbum, onKeyboardExpanded: onKeyboardExpand),
      ],
    );
  }
}
