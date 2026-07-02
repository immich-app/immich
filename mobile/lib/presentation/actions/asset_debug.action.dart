import 'dart:async';

import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/generated/translations.g.dart';
import 'package:immich_mobile/presentation/actions/action.dart';
import 'package:immich_mobile/providers/infrastructure/setting.provider.dart';
import 'package:immich_mobile/routing/router.dart';

class AssetDebugAction extends BaseAction {
  final List<BaseAsset> asset;

  AssetDebugAction._({this.asset = const [], required super.scope, super.isVisible})
    : super(icon: Icons.help_outline_rounded, label: scope.context.t.troubleshoot);

  factory AssetDebugAction({required Iterable<BaseAsset> assets, required ActionScope scope}) => AssetDebugAction._(
    asset: assets.toList(growable: false),
    scope: scope,
    isVisible: scope.ref.watch(settingsProvider.notifier).get(.advancedTroubleshooting) && assets.length == 1,
  );

  @override
  Future<void> onAction() async => unawaited(scope.context.pushRoute(AssetTroubleshootRoute(asset: asset.first)));
}
