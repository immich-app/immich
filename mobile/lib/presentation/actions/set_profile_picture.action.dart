import 'dart:async';

import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/generated/translations.g.dart';
import 'package:immich_mobile/presentation/actions/action.dart';
import 'package:immich_mobile/routing/router.dart';

class SetProfilePictureAction extends BaseAction {
  const SetProfilePictureAction();

  @override
  IconData get icon => Icons.account_circle_outlined;

  @override
  String label(context) => context.t.set_as_profile_picture;

  @override
  bool isVisible(WidgetRef ref, Iterable<BaseAsset> assets) => assets.isNotEmpty;

  @override
  Future<void> onAction(WidgetRef ref, Iterable<BaseAsset> assets) async =>
      unawaited(ref.context.pushRoute(ProfilePictureCropRoute(asset: assets.first)));
}
