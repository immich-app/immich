import 'dart:async';

import 'package:patrol/patrol.dart';

/// Wait for a native permission dialog and grant it.
Future<void> grantPermissionIfRequested(PatrolIntegrationTester $) async {
  try {
    await $.platformAutomator.mobile.grantPermissionWhenInUse();
  } catch (_) {
    // No permission dialog appeared, that's fine
  }
}

/// Wait for a native permission dialog and deny it.
Future<void> denyPermissionIfRequested(PatrolIntegrationTester $) async {
  try {
    await $.platformAutomator.mobile.denyPermission();
  } catch (_) {
    // No permission dialog appeared, that's fine
  }
}

/// Retry an action until it succeeds or times out.
Future<void> retryUntil(
  Future<void> Function() action, {
  Duration timeout = const Duration(seconds: 30),
  Duration interval = const Duration(seconds: 2),
}) async {
  final deadline = DateTime.now().add(timeout);
  Object? lastError;

  while (DateTime.now().isBefore(deadline)) {
    try {
      await action();
      return;
    } on Exception catch (e) {
      lastError = e;
      await Future.delayed(interval);
    }
  }

  throw TimeoutException(
    'retryUntil timed out after $timeout. Last error: $lastError',
  );
}
