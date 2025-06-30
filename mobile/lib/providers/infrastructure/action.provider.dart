import 'package:immich_mobile/services/action.service.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

final actionProvider = NotifierProvider<ActionNotifier, void>(
  ActionNotifier.new,
  dependencies: [
    actionServiceProvider,
  ],
);

class ActionNotifier extends Notifier<void> {
  late final ActionService _service;

  ActionNotifier() : super();

  @override
  void build() {
    _service = ref.watch(actionServiceProvider);
  }

  Future<void> favorite(List<String> ids) async {
    await _service.favorite(ids);
  }

  Future<void> unFavorite(List<String> ids) async {
    await _service.unFavorite(ids);
  }
}
