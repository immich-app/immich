import 'dart:async';

sealed class ImEvent {
  const ImEvent();
}

class ImTimelineReloadEvent extends ImEvent {
  const ImTimelineReloadEvent();
}

class EventStream {
  EventStream._();

  static final EventStream I = EventStream._();

  final StreamController<ImEvent> _controller =
      StreamController<ImEvent>.broadcast();

  void emit(ImEvent event) {
    _controller.add(event);
  }

  Stream<T> where<T extends ImEvent>() {
    if (T == ImEvent) {
      return _controller.stream as Stream<T>;
    }
    return _controller.stream.where((event) => event is T).cast<T>();
  }

  StreamSubscription<T> listen<T extends ImEvent>(
    void Function(T event)? onData, {
    Function? onError,
    void Function()? onDone,
    bool? cancelOnError,
  }) {
    return where<T>().listen(
      onData,
      onError: onError,
      onDone: onDone,
      cancelOnError: cancelOnError,
    );
  }

  /// Closes the stream controller
  void dispose() {
    _controller.close();
  }
}
