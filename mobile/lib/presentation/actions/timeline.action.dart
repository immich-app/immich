import 'package:flutter/material.dart';
import 'package:immich_mobile/presentation/actions/action.dart';
import 'package:immich_mobile/providers/timeline/multiselect.provider.dart';

class TimelineAction extends BaseAction {
  final BaseAction action;

  const TimelineAction({required this.action});

  @override
  TimelineActionView resolve(ActionScope scope) => .new(view: action.resolve(scope), scope: scope);
}

@visibleForTesting
class TimelineActionView extends ActionView {
  final ActionView view;

  const TimelineActionView({required this.view, required super.scope});

  @override
  IconData get icon => view.icon;

  @override
  String get label => view.label;

  @override
  bool get isVisible => view.isVisible;

  @override
  Future<void> onAction() async {
    await view.onAction();
    scope.ref.read(multiSelectProvider.notifier).reset();
  }
}
