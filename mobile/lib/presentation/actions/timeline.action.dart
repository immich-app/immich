import 'package:flutter/material.dart';
import 'package:immich_mobile/presentation/actions/action.dart';
import 'package:immich_mobile/providers/timeline/multiselect.provider.dart';

class TimelineAction extends BaseAction {
  final BaseAction action;

  const TimelineAction({required this.action});

  @override
  IconData get icon => action.icon;

  @override
  String label(ActionScope scope) => action.label(scope);

  @override
  bool isVisible(ActionScope scope) => action.isVisible(scope);

  @override
  Future<void> onAction(ActionScope scope) async {
    await action.onAction(scope);
    scope.ref.read(multiSelectProvider.notifier).reset();
  }
}
