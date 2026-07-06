import 'dart:async';

import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/generated/translations.g.dart';
import 'package:immich_mobile/presentation/actions/action.dart';
import 'package:immich_mobile/routing/router.dart';

class SetProfilePictureAction extends BaseAction {
  final BaseAsset asset;

  SetProfilePictureAction({required this.asset, required super.scope})
    : super(icon: Icons.account_circle_outlined, label: scope.context.t.set_as_profile_picture);

  @override
  Future<void> onAction() async => unawaited(scope.context.pushRoute(ProfilePictureCropRoute(asset: asset)));
}
