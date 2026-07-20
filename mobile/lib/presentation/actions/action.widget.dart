import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/widgets.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/constants/enums.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/presentation/actions/action.dart';
import 'package:immich_mobile/presentation/actions/timeline.action.dart';
import 'package:immich_mobile/providers/asset_viewer/asset_viewer.provider.dart';
import 'package:immich_mobile/providers/timeline/multiselect.provider.dart';
import 'package:immich_mobile/providers/user.provider.dart';
import 'package:immich_mobile/utils/error_handler.dart';
import 'package:immich_ui/immich_ui.dart';

typedef _ActionWidgetScope = ({
  IconData icon,
  String label,
  FutureOr<void> Function() onAction,
  FutureOr<void> Function()? onSecondaryAction,
});

class _ActionWidget extends ConsumerWidget {
  final BaseAction action;
  final ActionSource? source;
  final Widget Function(_ActionWidgetScope context) builder;

  const _ActionWidget({required this.action, required this.builder, this.source});

  Future<void> _guard(Future<void> Function() handler) async {
    try {
      await handler();
    } catch (error, stackTrace) {
      handleError(error, stack: stackTrace, description: 'Action failed: ${action.runtimeType}');
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final assets = source?.select(ref) ?? const <BaseAsset>[];
    final authUser = ref.watch(currentUserProvider);
    if (authUser == null || !action.isVisible(ref, assets)) {
      return const SizedBox.shrink();
    }

    final secondaryAction = action.onSecondaryAction;
    return builder((
      icon: action.icon,
      label: action.label(context),
      onAction: () => _guard(() => action.onAction(ref, assets)),
      onSecondaryAction: secondaryAction == null ? null : () => _guard(() => secondaryAction(ref, assets)),
    ));
  }
}

class ActionIconButtonWidget extends StatelessWidget {
  final BaseAction action;
  final ActionSource? source;
  final ImmichVariant variant;

  const ActionIconButtonWidget({super.key, required this.action, this.source, this.variant = .ghost});

  @override
  Widget build(BuildContext context) => _ActionWidget(
    action: action,
    source: source,
    builder: (ctx) =>
        ImmichIconButton(icon: ctx.icon, onPressed: ctx.onAction, onLongPress: ctx.onSecondaryAction, variant: variant),
  );
}

class ActionButtonWidget extends StatelessWidget {
  final BaseAction action;
  final ActionSource? source;
  final ImmichVariant variant;

  const ActionButtonWidget({super.key, required this.action, this.source, this.variant = .ghost});

  @override
  Widget build(BuildContext context) => _ActionWidget(
    action: action,
    source: source,
    builder: (ctx) => ImmichTextButton(
      labelText: ctx.label,
      icon: ctx.icon,
      onPressed: ctx.onAction,
      onLongPress: ctx.onSecondaryAction,
      variant: variant,
    ),
  );
}

class ActionColumnButtonWidget extends StatelessWidget {
  final BaseAction action;
  final ActionSource? source;

  const ActionColumnButtonWidget({super.key, required this.action, this.source});

  @override
  Widget build(BuildContext context) => _ActionWidget(
    action: action,
    source: source,
    builder: (ctx) => ImmichColumnButton(
      icon: ctx.icon,
      label: ctx.label,
      onPressed: ctx.onAction,
      onLongPress: ctx.onSecondaryAction,
    ),
  );
}

class ActionMenuItemWidget extends StatelessWidget {
  final BaseAction action;
  final ActionSource? source;

  const ActionMenuItemWidget({super.key, required this.action, this.source});

  @override
  Widget build(BuildContext context) => _ActionWidget(
    action: action,
    source: source,
    builder: (ctx) => ImmichMenuItem(icon: ctx.icon, label: ctx.label, onPressed: ctx.onAction),
  );
}

class TimelineSheetActionWidget extends StatelessWidget {
  final BaseAction action;

  const TimelineSheetActionWidget({super.key, required this.action});

  @override
  Widget build(BuildContext context) => ActionColumnButtonWidget(
    source: .timeline,
    action: TimelineAction(action: action),
  );
}

extension on ActionSource {
  Iterable<BaseAsset> select(WidgetRef ref) => switch (this) {
    .timeline => ref.watch(multiSelectProvider.select((s) => s.selectedAssets)),
    .viewer => switch (ref.watch(assetViewerProvider.select((s) => s.currentAsset))) {
      final a? => [a],
      null => const [],
    },
  };
}
