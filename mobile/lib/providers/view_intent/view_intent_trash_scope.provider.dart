import 'package:hooks_riverpod/hooks_riverpod.dart';

class ViewIntentTrashScopeNotifier extends Notifier<bool> {
  @override
  bool build() => false;

  void set(bool isTrashScoped) => state = isTrashScoped;

  void clear() => state = false;
}

final viewIntentTrashScopeProvider = NotifierProvider<ViewIntentTrashScopeNotifier, bool>(
  ViewIntentTrashScopeNotifier.new,
);
