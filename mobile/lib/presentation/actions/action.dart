import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/domain/models/user.model.dart';
import 'package:immich_mobile/providers/user.provider.dart';

abstract class BaseAction {
  const BaseAction();

  IconData icon(WidgetRef ref);

  String label(BuildContext context);

  bool isVisible(WidgetRef ref, Iterable<BaseAsset> assets) => true;

  @protected
  @visibleForTesting
  UserDto currentUser(WidgetRef ref) => ref.read(currentUserProvider)!;

  Future<void> onAction(WidgetRef ref, Iterable<BaseAsset> assets);

  Future<void> Function(WidgetRef ref, Iterable<BaseAsset> assets)? get onSecondaryAction => null;
}
