import 'dart:async';

import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:immich_mobile/generated/translations.g.dart';
import 'package:immich_mobile/presentation/actions/action.dart';
import 'package:immich_mobile/providers/infrastructure/timeline.provider.dart';
import 'package:immich_mobile/routing/router.dart';

class SlideshowAction extends BaseAction {
  SlideshowAction({required super.scope}) : super(icon: Icons.slideshow, label: scope.context.t.slideshow);

  @override
  Future<void> onAction() async {
    final ActionScope(:context, :ref) = scope;
    unawaited(context.pushRoute(DriftSlideshowRoute(timeline: ref.read(timelineServiceProvider))));
  }
}
