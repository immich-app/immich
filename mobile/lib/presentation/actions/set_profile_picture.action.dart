import 'dart:async';

import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/generated/translations.g.dart';
import 'package:immich_mobile/presentation/actions/action.dart';
import 'package:immich_mobile/routing/router.dart';

class SetProfilePictureAction extends ActionBuilder {
  final BaseAsset asset;

  const SetProfilePictureAction({required this.asset});

  @override
  ActionItem create(BuildContext context, WidgetRef ref) => .new(
    icon: Icons.account_circle_outlined,
    label: context.t.set_as_profile_picture,
    onAction: () async => unawaited(context.pushRoute(ProfilePictureCropRoute(asset: asset))),
  );
}
