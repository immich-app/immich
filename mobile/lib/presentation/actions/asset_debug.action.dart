import 'dart:async';

import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart' hide Action;
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/generated/translations.g.dart';
import 'package:immich_mobile/presentation/actions/action.dart';
import 'package:immich_mobile/presentation/actions/asset_action.dart';
import 'package:immich_mobile/providers/infrastructure/setting.provider.dart';
import 'package:immich_mobile/routing/router.dart';

class AssetDebugAction extends AssetAction {
  const AssetDebugAction({super.key, super.display, super.source});

  @override
  Action resolve(BuildContext context, WidgetRef ref) {
    final (:assets, :clearSelect) = ref.watch(assetsActionProvider(source));
    final advancedTroubleshooting = ref.watch(settingsProvider.notifier).get(.advancedTroubleshooting);

    return Action(
      icon: Icons.help_outline_rounded,
      isVisible: assets.length == 1 && advancedTroubleshooting,
      label: context.t.troubleshoot,
      onAction: () async {
        unawaited(context.pushRoute(AssetTroubleshootRoute(asset: assets.first)));
        clearSelect();
      },
    );
  }
}
