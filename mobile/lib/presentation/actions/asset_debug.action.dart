import 'dart:async';

import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/generated/translations.g.dart';
import 'package:immich_mobile/presentation/actions/action.dart';
import 'package:immich_mobile/providers/infrastructure/setting.provider.dart';
import 'package:immich_mobile/routing/router.dart';

class AssetDebugAction extends BaseAction {
  const AssetDebugAction();

  @override
  IconData get icon => Icons.help_outline_rounded;

  @override
  String label(context) => context.t.troubleshoot;

  @override
  bool isVisible(WidgetRef ref, Iterable<BaseAsset> assets) =>
      assets.singleOrNull != null && ref.watch(settingsProvider.notifier).get(.advancedTroubleshooting);

  @override
  Future<void> onAction(WidgetRef ref, Iterable<BaseAsset> assets) async =>
      unawaited(ref.context.pushRoute(AssetTroubleshootRoute(asset: assets.single)));
}
