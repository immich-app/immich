import 'dart:async';

import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/generated/translations.g.dart';
import 'package:immich_mobile/presentation/actions/action.dart';
import 'package:immich_mobile/providers/infrastructure/timeline.provider.dart';
import 'package:immich_mobile/routing/router.dart';

class SlideshowAction extends ActionBuilder {
  const SlideshowAction();

  @override
  ActionItem create(BuildContext context, WidgetRef ref) => .new(
    icon: Icons.slideshow,
    label: context.t.slideshow,
    onAction: () async => unawaited(context.pushRoute(SlideshowRoute(timeline: ref.read(timelineServiceProvider)))),
  );
}
