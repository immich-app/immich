import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/presentation/actions/action.dart';
import 'package:immich_mobile/providers/timeline/multiselect.provider.dart';

/// Decorates an action so the multi-select is cleared after it runs.
class TimelineAction extends BaseAction {
  final BaseAction action;

  const TimelineAction({required this.action});

  @override
  IconData get icon => action.icon;

  @override
  String label(BuildContext context) => action.label(context);

  @override
  bool isVisible(WidgetRef ref, Iterable<BaseAsset> assets) => action.isVisible(ref, assets);

  @override
  Future<void> onAction(WidgetRef ref, Iterable<BaseAsset> assets) async {
    await action.onAction(ref, assets);
    ref.read(multiSelectProvider.notifier).reset();
  }

  @override
  Future<void> Function(WidgetRef ref, Iterable<BaseAsset> assets)? get onSecondaryAction {
    final onSecondaryAction = action.onSecondaryAction;
    if (onSecondaryAction == null) {
      return null;
    }

    return (ref, assets) async {
      await onSecondaryAction(ref, assets);
      ref.read(multiSelectProvider.notifier).reset();
    };
  }
}
