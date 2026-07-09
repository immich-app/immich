import 'dart:async';

import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/generated/translations.g.dart';
import 'package:immich_mobile/presentation/actions/action.dart';
import 'package:immich_mobile/routing/router.dart';
import 'package:immich_mobile/utils/asset_filter.dart';

class ShareLinkAction extends BaseAction {
  final List<String> remoteIds;

  ShareLinkAction._({required this.remoteIds, required super.scope, super.isVisible})
    : super(icon: Icons.link_rounded, label: scope.context.t.share_link);

  factory ShareLinkAction({required Iterable<BaseAsset> assets, required ActionScope scope}) {
    final remoteIds = AssetFilter(assets).remote().map((asset) => asset.id).toList(growable: false);
    return ._(remoteIds: remoteIds, scope: scope, isVisible: remoteIds.isNotEmpty);
  }

  @override
  Future<void> onAction() async => unawaited(scope.context.pushRoute(SharedLinkEditRoute(assetsList: remoteIds)));
}
