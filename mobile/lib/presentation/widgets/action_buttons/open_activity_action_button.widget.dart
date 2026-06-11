import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/extensions/translate_extensions.dart';
import 'package:immich_mobile/presentation/widgets/action_buttons/base_action_button.widget.dart';
import 'package:immich_mobile/providers/asset_viewer/asset_viewer.provider.dart';
import 'package:immich_mobile/providers/infrastructure/current_album.provider.dart';
import 'package:immich_mobile/routing/router.dart';

class OpenActivityActionButton extends ConsumerWidget {
  const OpenActivityActionButton({super.key, this.iconOnly = false, this.menuItem = false});

  final bool iconOnly;
  final bool menuItem;

  void _onTap(BuildContext context, WidgetRef ref) {
    final album = ref.read(currentRemoteAlbumProvider);
    final asset = ref.read(assetViewerProvider).currentAsset;
    if (album == null || asset == null) {
      return;
    }
    context.router.push(
      DriftActivitiesRoute(album: album, assetId: asset is RemoteAsset ? asset.id : null, assetName: asset.name),
    );
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) => BaseActionButton(
    iconData: Icons.chat_outlined,
    label: "activity".t(context: context),
    onPressed: () => _onTap(context, ref),
    iconOnly: iconOnly,
    menuItem: menuItem,
  );
}
