import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/constants/enums.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/extensions/translate_extensions.dart';
import 'package:immich_mobile/presentation/widgets/action_buttons/base_action_button.widget.dart';
import 'package:immich_mobile/providers/timeline/multiselect.provider.dart';
import 'package:immich_mobile/routing/router.dart';

class ShareLinkActionButton extends ConsumerWidget {
  final ActionSource source;

  const ShareLinkActionButton({super.key, required this.source});

  onAction(BuildContext context, WidgetRef ref) {
    switch (source) {
      case ActionSource.timeline:
        timelineAction(context, ref);
      case ActionSource.viewer:
        viewerAction(ref);
    }
  }

  void timelineAction(BuildContext context, WidgetRef ref) {
    final ids = ref
        .read(multiSelectProvider.select((value) => value.selectedAssets))
        .whereType<RemoteAsset>()
        .toList()
        .map((asset) => asset.id)
        .toList();

    context.pushRoute(
      SharedLinkEditRoute(
        assetsList: ids,
      ),
    );
  }

  void viewerAction(WidgetRef _) {
    UnimplementedError("Viewer action for favorite is not implemented yet.");
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return BaseActionButton(
      iconData: Icons.link_rounded,
      label: "share_link".t(context: context),
      onPressed: () => onAction(context, ref),
    );
  }
}
