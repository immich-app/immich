import 'package:hooks_riverpod/hooks_riverpod.dart';

/// Provider holding a boolean function that returns true when cancellation is requested.
/// A computation running in the isolate uses the function to implement cooperative cancellation.
final cancellationProvider = Provider<bool Function()>(
  // This will be overridden in the isolate's container.
  // Throwing ensures it's not used without an override.
  (ref) => throw UnimplementedError(
    "cancellationProvider must be overridden in the isolate's ProviderContainer and not to be used in the root isolate",
  ),
  name: 'cancellationProvider',
);
