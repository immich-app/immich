import 'dart:async';

import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/generated/translations.g.dart';
import 'package:immich_mobile/presentation/actions/action.dart';
import 'package:immich_mobile/routing/router.dart';
import 'package:immich_mobile/utils/asset_filter.dart';

class ShareLinkAction extends BaseAction {
  const ShareLinkAction();

  @override
  IconData icon(_) => Icons.link_rounded;

  @override
  String label(context) => context.t.share_link;

  @visibleForTesting
  Iterable<String> assetsForAction(Iterable<BaseAsset> assets) => AssetFilter(assets).remote().map((asset) => asset.id);

  @override
  bool isVisible(WidgetRef ref, Iterable<BaseAsset> assets) => assetsForAction(assets).isNotEmpty;

  @override
  Future<void> onAction(WidgetRef ref, Iterable<BaseAsset> assets) async => unawaited(
    ref.context.pushRoute(SharedLinkEditRoute(assetsList: assetsForAction(assets).toList(growable: false))),
  );
}
