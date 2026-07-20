import 'dart:async';

import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/generated/translations.g.dart';
import 'package:immich_mobile/presentation/actions/action.dart';
import 'package:immich_mobile/widgets/asset_viewer/cast_dialog.dart';

class CastAction extends BaseAction {
  const CastAction();

  @override
  IconData get icon => Icons.cast_rounded;

  @override
  String label(context) => context.t.cast;

  @override
  Future<void> onAction(WidgetRef ref, Iterable<BaseAsset> assets) async =>
      unawaited(showDialog(context: ref.context, builder: (_) => const CastDialog()));
}

class UnCastAction extends BaseAction {
  const UnCastAction();

  @override
  IconData get icon => Icons.cast_connected_rounded;

  @override
  String label(context) => context.t.cast;

  @override
  Future<void> onAction(WidgetRef ref, Iterable<BaseAsset> assets) async =>
      unawaited(showDialog(context: ref.context, builder: (_) => const CastDialog()));
}
