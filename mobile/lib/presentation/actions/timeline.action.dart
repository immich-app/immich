import 'package:immich_mobile/presentation/actions/action.dart';
import 'package:immich_mobile/providers/timeline/multiselect.provider.dart';

class TimelineAction extends BaseAction {
  final BaseAction action;

  TimelineAction({required this.action})
    : super(scope: action.scope, icon: action.icon, label: action.label, isVisible: action.isVisible);

  @override
  Future<void> onAction() async {
    await action.onAction();
    scope.ref.read(multiSelectProvider.notifier).reset();
  }

  @override
  Future<void> Function()? get onSecondaryAction {
    final inner = action.onSecondaryAction;
    if (inner == null) {
      return null;
    }

    return () async {
      await inner();
      scope.ref.read(multiSelectProvider.notifier).reset();
    };
  }
}
