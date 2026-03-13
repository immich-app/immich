import 'package:patrol/patrol.dart';

/// Default Patrol configuration for all Immich integration tests.
///
/// Uses [SettlePolicy.noSettle] because Immich has persistent animations
/// (loading spinners, background sync indicators) that prevent
/// pumpAndSettle from ever completing. Instead, we pump frames manually
/// and rely on waitUntilVisible/existsTimeout for widget readiness.
const patrolConfig = PatrolTesterConfig(
  // Timeout for finding widgets
  existsTimeout: Duration(seconds: 30),
  // Timeout for settling after interactions
  settleTimeout: Duration(seconds: 30),
  // Don't wait for all animations — Immich has persistent animations
  settlePolicy: SettlePolicy.noSettle,
);
