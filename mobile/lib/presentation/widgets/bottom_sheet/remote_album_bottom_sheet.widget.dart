import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/constants/enums.dart';
import 'package:immich_mobile/domain/models/album/album.model.dart';
import 'package:immich_mobile/extensions/translate_extensions.dart';
import 'package:immich_mobile/presentation/actions/action.dart';
import 'package:immich_mobile/presentation/actions/action.widget.dart';
import 'package:immich_mobile/presentation/actions/asset_actions.dart';
import 'package:immich_mobile/presentation/actions/remove_from_album.action.dart';
import 'package:immich_mobile/presentation/actions/set_album_cover.action.dart';
import 'package:immich_mobile/presentation/actions/share.action.dart';
import 'package:immich_mobile/presentation/actions/share_link.action.dart';
import 'package:immich_mobile/presentation/actions/timeline.action.dart';
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

    final scope = ActionScope.from(context, ref);
    final assets = multiselect.selectedAssets.toList(growable: false);
    final actions = AssetActions.from(scope, assets);

    return BaseBottomSheet(
      controller: sheetController,
      initialChildSize: 0.22,
      minChildSize: 0.22,
      maxChildSize: 0.85,
      shouldCloseOnMinExtent: false,
      actions: [
        ActionColumnButtonWidget(
          action: ShareAction(assets: assets, scope: scope),
        ),
        if (multiselect.hasRemote) ...[
          ActionColumnButtonWidget(
            action: ShareLinkAction(assets: assets, scope: scope),
          ),

          if (ownsAlbum) ...[
            ...[
              actions.favorite,
              actions.archive,
              actions.delete,
              actions.cleanup,
              actions.stack,
              actions.lock,
              actions.editDateTime,
              actions.editLocation,
            ].map((action) => ActionColumnButtonWidget(action: TimelineAction(action: action))),
          ],
          ActionColumnButtonWidget(action: TimelineAction(action: actions.download)),
        ],
        if (ownsAlbum)
          ActionColumnButtonWidget(
            action: TimelineAction(
              action: RemoveFromAlbumAction(assets: assets, albumId: widget.album.id, scope: scope),
            ),
          ),
        if (ownsAlbum)
          ActionColumnButtonWidget(
            action: TimelineAction(
              action: SetAlbumCoverAction(assets: assets, albumId: widget.album.id, scope: scope),
            ),
          ),
      ],
      slivers: ownsAlbum
          ? [const AddToAlbumHeader(), AlbumSelector(onAlbumSelected: addToAlbum, onKeyboardExpanded: onKeyboardExpand)]
          : null,
    );
  }
}
