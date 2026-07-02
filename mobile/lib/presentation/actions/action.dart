import 'dart:async';

import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/domain/models/user.model.dart';
import 'package:immich_mobile/utils/asset_filter.dart';

class ActionScope {
  final BuildContext context;
  final WidgetRef ref;
  final UserDto authUser;

  const ActionScope({required this.context, required this.ref, required this.authUser});
}

abstract class BaseAction {
  const BaseAction();

  ActionView resolve(ActionScope scope);
}

abstract class AssetAction<T extends BaseAsset> extends BaseAction {
  final Iterable<BaseAsset> assets;

  const AssetAction({required this.assets});

  @override
  AssetActionView resolve(ActionScope scope);
}

abstract class ActionView {
  final ActionScope scope;

  const ActionView({required this.scope});

  IconData get icon;

  String get label;

  bool get isVisible => true;

  FutureOr<void> onAction();
}

abstract class AssetActionView<T extends BaseAsset> extends ActionView {
  final Iterable<BaseAsset> assets;

  const AssetActionView({required this.assets, required super.scope});

  AssetFilter<T> get filter => .new(assets.whereType<T>());

  @override
  bool get isVisible => filter.isNotEmpty;
}
