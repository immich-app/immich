import 'dart:async';

import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/generated/translations.g.dart';
import 'package:immich_mobile/presentation/actions/action.dart';
import 'package:immich_mobile/providers/infrastructure/setting.provider.dart';
import 'package:immich_mobile/routing/router.dart';

class AssetDebugAction extends AssetAction<BaseAsset> {
  const AssetDebugAction({required super.assets});

  @override
  IconData get icon => Icons.help_outline_rounded;

  @override
  String label(ActionScope scope) => scope.context.t.troubleshoot;

  @override
  bool isVisible(ActionScope scope) =>
      assets.length == 1 && scope.ref.watch(settingsProvider.notifier).get(.advancedTroubleshooting);

  @override
  Future<void> onAction(ActionScope scope) async =>
      unawaited(scope.context.pushRoute(AssetTroubleshootRoute(asset: assets.first)));
}
