import 'dart:async';

import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/generated/translations.g.dart';
import 'package:immich_mobile/presentation/actions/action.dart';
import 'package:immich_mobile/providers/infrastructure/setting.provider.dart';
import 'package:immich_mobile/routing/router.dart';

class AssetDebugAction extends AssetActionBuilder {
  const AssetDebugAction({required super.source});

  @override
  ActionItem? build(BuildContext context, WidgetRef ref) {
    final assets = ref.watch(assetsActionProvider(source)).assets;
    final troubleshootEnabled = ref.watch(settingsProvider.notifier).get(.advancedTroubleshooting);
    if (!troubleshootEnabled || assets.length != 1) {
      return null;
    }

    return .new(
      icon: Icons.help_outline_rounded,
      label: context.t.troubleshoot,
      onAction: () async => unawaited(context.pushRoute(AssetTroubleshootRoute(asset: assets.single))),
    );
  }
}
