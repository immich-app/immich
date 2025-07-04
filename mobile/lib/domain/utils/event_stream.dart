import 'dart:async';

sealed class Event {
  const Event();
}

class TimelineReloadEvent extends Event {
  const TimelineReloadEvent();
}

class EventStream {
  EventStream._();

  static final EventStream shared = EventStream._();

  final StreamController<Event> _controller =
      StreamController<Event>.broadcast();

  void emit(Event event) {
    _controller.add(event);
  }

  Stream<T> where<T extends Event>() {
    if (T == Event) {
      return _controller.stream as Stream<T>;
    }
    return _controller.stream.where((event) => event is T).cast<T>();
  }

  StreamSubscription<T> listen<T extends Event>(
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
