import 'dart:async';

import 'package:hooks_riverpod/hooks_riverpod.dart';

/// Holds the isolate's cancellation signal.
final cancellationProvider = Provider<Completer<void>>(
  // This will be overridden in the isolate's container.
  // Throwing ensures it's not used without an override.
  (ref) => throw UnimplementedError(
    "cancellationProvider must be overridden in the isolate's ProviderContainer and not to be used in the root isolate",
  ),
  name: 'cancellationProvider',
);
