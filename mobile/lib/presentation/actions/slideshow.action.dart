import 'dart:async';

import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/generated/translations.g.dart';
import 'package:immich_mobile/presentation/actions/action.dart';
import 'package:immich_mobile/providers/infrastructure/timeline.provider.dart';
import 'package:immich_mobile/routing/router.dart';

class SlideshowAction extends BaseAction {
  const SlideshowAction();

  @override
  IconData icon(_) => Icons.slideshow;

  @override
  String label(context) => context.t.slideshow;

  @override
  Future<void> onAction(WidgetRef ref, Iterable<BaseAsset> assets) async =>
      unawaited(ref.context.pushRoute(DriftSlideshowRoute(timeline: ref.read(timelineServiceProvider))));
}
