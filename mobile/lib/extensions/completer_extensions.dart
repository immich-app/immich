import 'dart:async';

extension CompleterExtensions<T> on Completer<T> {
  void completeOnce([FutureOr<T>? value]) {
    if (!isCompleted) {
      complete(value);
    }
  }
}
