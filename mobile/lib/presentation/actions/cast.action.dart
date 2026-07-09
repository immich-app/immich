import 'dart:async';

import 'package:flutter/material.dart';
import 'package:immich_mobile/generated/translations.g.dart';
import 'package:immich_mobile/presentation/actions/action.dart';
import 'package:immich_mobile/providers/cast.provider.dart';
import 'package:immich_mobile/widgets/asset_viewer/cast_dialog.dart';

class CastAction extends BaseAction {
  const CastAction._({required super.scope, required super.icon, required super.label});

  factory CastAction({required ActionScope scope}) {
    final casting = scope.ref.watch(castProvider.select((state) => state.isCasting));
    return CastAction._(
      scope: scope,
      icon: casting ? Icons.cast_connected_rounded : Icons.cast_rounded,
      label: scope.context.t.cast,
    );
  }

  @override
  Future<void> onAction() async {
    unawaited(showDialog(context: scope.context, builder: (_) => const CastDialog()));
  }
}
