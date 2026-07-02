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
  AssetDebugActionView resolve(ActionScope scope) => .new(assets: assets, scope: scope);
}

@visibleForTesting
class AssetDebugActionView extends AssetActionView<BaseAsset> {
  const AssetDebugActionView({required super.assets, required super.scope});

  @override
  IconData get icon => Icons.help_outline_rounded;

  @override
  String get label => scope.context.t.troubleshoot;

  @override
  bool get isVisible => scope.ref.watch(settingsProvider.notifier).get(.advancedTroubleshooting) && assets.length == 1;

  @override
  Future<void> onAction() async => unawaited(scope.context.pushRoute(AssetTroubleshootRoute(asset: assets.first)));
}
