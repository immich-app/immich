import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/extensions/translate_extensions.dart';
import 'package:immich_mobile/presentation/widgets/action_buttons/base_action_button.widget.dart';
import 'package:immich_mobile/providers/timeline/multiselect.provider.dart';
import 'package:immich_mobile/routing/router.dart';

class ShareLinkActionButton extends ConsumerWidget {
  const ShareLinkActionButton({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final assets =
        ref.watch(multiSelectProvider.select((value) => value.selectedAssets));

    void onAction() {
      List<Asset> remoteAssets = assets.whereType<Asset>().toList();

      context.pushRoute(
        SharedLinkEditRoute(
          assetsList: remoteAssets.map((e) => e.id).toList(),
        ),
      );
    }

    return BaseActionButton(
      iconData: Icons.link_rounded,
      label: "share_link".t(context: context),
      onPressed: onAction,
    );
  }
}
