import 'package:async/async.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';

RestartableTimer useTimer(
  Duration duration,
  void Function() callback,
) {
  return use(
    _TimerHook(
      duration: duration,
      callback: callback,
    ),
  );
}

class _TimerHook extends Hook<RestartableTimer> {
  final Duration duration;
  final void Function() callback;

  const _TimerHook({
    required this.duration,
    required this.callback,
  });
  @override
  HookState<RestartableTimer, Hook<RestartableTimer>> createState() =>
      _TimerHookState();
}

class _TimerHookState extends HookState<RestartableTimer, _TimerHook> {
  late RestartableTimer timer;
  @override
  void initHook() {
    super.initHook();
    timer = RestartableTimer(hook.duration, hook.callback);
  }

  @override
  RestartableTimer build(BuildContext context) {
    return timer;
  }

  @override
  void dispose() {
    timer.cancel();
    super.dispose();
  }
}
