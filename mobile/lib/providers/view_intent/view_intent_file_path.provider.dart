import 'package:hooks_riverpod/hooks_riverpod.dart';

class ViewIntentFilePathNotifier extends Notifier<String?> {
  @override
  String? build() => null;

  void setPath(String path) {
    if (state == path) {
      return;
    }
    state = path;
  }

  void clear() {
    if (state == null) {
      return;
    }
    state = null;
  }

  void clearIfMatch(String path) {
    if (state != path) {
      return;
    }
    state = null;
  }
}

final viewIntentFilePathProvider = NotifierProvider<ViewIntentFilePathNotifier, String?>(
  ViewIntentFilePathNotifier.new,
);
