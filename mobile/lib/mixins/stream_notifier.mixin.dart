import 'dart:async';

import 'package:hooks_riverpod/hooks_riverpod.dart';

/// Converts a [Stream] into an [AsyncNotifier]
///
/// The [build] method MUST call [buildFromStream] in order to properly subscribe
mixin StreamNotifierMixin<T> {
  set state(AsyncValue<T> value);

  /// Forwards data into the notifier from [stream]. Future will stay open until [stream] completes
  ///
  /// Must be called in [build]
  Future<T> buildFromStream(
    Ref<AsyncValue<T>> ref,
    Stream<T> stream, {
    required T Function(Object error, StackTrace stack) onError,
  }) {
    final completer = Completer<T>();

    void apply(T value) {
      if (completer.isCompleted) {
        state = AsyncData(value);
      } else {
        completer.complete(value);
      }
    }

    final subscription = stream.listen(
      apply,
      onError: (Object error, StackTrace stack) => apply(onError(error, stack)),
    );
    ref.onDispose(subscription.cancel);

    return completer.future;
  }
}
