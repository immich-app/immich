import 'dart:async';
import 'dart:ui';

import 'package:flutter_hooks/flutter_hooks.dart';

// https://github.com/rrousselGit/flutter_hooks/issues/233#issuecomment-840416638
void useInterval(Duration delay, VoidCallback callback) {
  final savedCallback = useRef(callback);
  savedCallback.value = callback;

  useEffect(
    () {
      final timer = Timer.periodic(delay, (_) => savedCallback.value());
      return timer.cancel;
    },
    [delay],
  );
}
