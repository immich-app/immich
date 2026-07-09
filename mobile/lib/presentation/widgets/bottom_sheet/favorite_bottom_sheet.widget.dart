import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/constants/enums.dart';
import 'package:immich_mobile/domain/models/album/album.model.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/extensions/translate_extensions.dart';
import 'package:immich_mobile/presentation/actions/action.dart';
import 'package:immich_mobile/presentation/actions/action.widget.dart';
import 'package:immich_mobile/presentation/actions/asset_actions.dart';
import 'package:immich_mobile/presentation/actions/share.action.dart';
import 'package:immich_mobile/presentation/actions/share_link.action.dart';
import 'package:immich_mobile/presentation/actions/timeline.action.dart';
import 'package:immich_mobile/presentation/widgets/action_buttons/download_action_button.widget.dart';
import 'package:immich_mobile/presentation/widgets/album/album_selector.widget.dart';
import 'package:immich_mobile/presentation/widgets/bottom_sheet/base_bottom_sheet.widget.dart';
import 'package:immich_mobile/providers/infrastructure/album.provider.dart';
import 'package:immich_mobile/providers/timeline/multiselect.provider.dart';
import 'package:immich_mobile/widgets/common/immich_toast.dart';

class FavoriteBottomSheet extends ConsumerWidget {
  const FavoriteBottomSheet({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final multiselect = ref.watch(multiSelectProvider);

    Future<void> addAssetsToAlbum(RemoteAlbum album) async {
      final selectedAssets = multiselect.selectedAssets;
      if (selectedAssets.isEmpty) {
        return;
      }

      final remoteAssets = selectedAssets.whereType<RemoteAsset>();
      final addedCount = await ref
          .read(remoteAlbumProvider.notifier)
          .addAssets(album.id, remoteAssets.map((e) => e.id).toList());

      if (selectedAssets.length != remoteAssets.length) {
        ImmichToast.show(
          context: context,
          msg: 'add_to_album_bottom_sheet_some_local_assets'.t(context: context),
        );
      }

      if (addedCount != remoteAssets.length) {
        ImmichToast.show(
          context: context,
          msg: 'add_to_album_bottom_sheet_already_exists'.t(args: {"album": album.name}),
        );
      } else {
        ImmichToast.show(
          context: context,
          msg: 'add_to_album_bottom_sheet_added'.t(args: {"album": album.name}),
        );
      }

      ref.read(multiSelectProvider.notifier).reset();
    }

    final scope = ActionScope.from(context, ref);
    final assets = multiselect.selectedAssets.toList(growable: false);
    final actions = AssetActions.from(scope, assets);

    return BaseBottomSheet(
      initialChildSize: 0.4,
      maxChildSize: 0.7,
      shouldCloseOnMinExtent: false,
      actions: [
        ActionColumnButtonWidget(
          action: ShareAction(assets: assets, scope: scope),
        ),
        if (multiselect.hasRemote) ...[
          ActionColumnButtonWidget(
            action: ShareLinkAction(assets: assets, scope: scope),
          ),
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
          if (multiselect.onlyRemote) const DownloadActionButton(source: ActionSource.timeline),
        ],
      ],
      slivers: multiselect.hasRemote
          ? [const AddToAlbumHeader(), AlbumSelector(onAlbumSelected: addAssetsToAlbum)]
          : [],
    );
  }
}
