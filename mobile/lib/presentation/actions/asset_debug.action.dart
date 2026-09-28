import 'dart:async';

import 'package:auto_route/auto_route.dart';
import 'package:collection/collection.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/generated/translations.g.dart';
import 'package:immich_mobile/presentation/actions/action.dart';
import 'package:immich_mobile/providers/infrastructure/setting.provider.dart';
import 'package:immich_mobile/routing/router.dart';

class AssetDebugAction extends AssetActionBuilder {
  const AssetDebugAction({required super.source});

  @override
  ActionItem? create(BuildContext context, WidgetRef ref) {
    final asset = ref.watch(assetsActionProvider(source)).assets.singleOrNull;
    final troubleshootEnabled = ref.watch(settingsProvider.notifier).get(.advancedTroubleshooting);
    if (!troubleshootEnabled || asset == null) {
      return null;
    }

    return .new(
      icon: Icons.help_outline_rounded,
      label: context.t.troubleshoot,
      onAction: () => unawaited(context.pushRoute(AssetTroubleshootRoute(asset: asset))),
    );
  }
}
