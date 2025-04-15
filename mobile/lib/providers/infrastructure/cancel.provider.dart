import 'dart:async';

import 'package:hooks_riverpod/hooks_riverpod.dart';

/// Provider holding a boolean notifier that becomes true when cancellation is requested.
/// A computation running in the isolate use the completer to implement cooperative cancellation.
final cancellationProvider = Provider<Completer<bool>>(
  // This will be overridden in the isolate's container.
  // Throwing ensures it's not used without an override.
  (ref) => throw UnimplementedError(
    "cancellationProvider must be overridden in the isolate's ProviderContainer and not to be used in the root isolate",
  ),
  name: 'cancellationProvider',
);
