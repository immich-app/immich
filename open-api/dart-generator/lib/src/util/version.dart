/// Parse Immich spec version strings into [SemVerLit]s at GENERATION time.
///
/// The spec's x-immich-history uses a mix of forms:
///   "v1"      → 1.0.0   (bare major — the app's SemVer.fromString would THROW)
///   "v2.6.0"  → 2.6.0
///   "2.5.0"   → 2.5.0   (no leading v)
///
/// Parsing here (rather than emitting `SemVer.fromString("v1")` for the app to
/// run) means the emitted `const SemVer(major: 1, minor: 0, patch: 0)` is
/// const-evaluable and the bare-major case never reaches the runtime parser.
library;

import '../ir/types.dart';

final _leadingV = RegExp(r'^v', caseSensitive: false);
final _suffix = RegExp(r'[-+]');

const _lifecycleByName = <String, LifecycleState>{
  'Added': LifecycleState.added,
  'Alpha': LifecycleState.alpha,
  'Beta': LifecycleState.beta,
  'Stable': LifecycleState.stable,
  'Updated': LifecycleState.updated,
  'Deprecated': LifecycleState.deprecated,
  'Internal': LifecycleState.internal,
};

/// Parse a single spec version string. Returns null when unparseable.
SemVerLit? parseSpecVersion(String raw) {
  final cleaned = raw.trim().replaceFirst(_leadingV, '');
  if (cleaned.isEmpty) return null;
  final core = cleaned.split(_suffix).first;
  final parts = core.split('.');
  final nums = <int>[];
  for (final p in parts) {
    final n = int.tryParse(p);
    if (n == null) return null;
    nums.add(n);
  }
  return SemVerLit(
    nums.isNotEmpty ? nums[0] : 0,
    nums.length > 1 ? nums[1] : 0,
    nums.length > 2 ? nums[2] : 0,
  );
}

LifecycleState? _coerceState(Object? raw) =>
    raw is String ? _lifecycleByName[raw] : null;

/// Build [VersionMeta] from raw x-immich-* extension values on a schema
/// property or an operation. Returns null when there's nothing to record.
VersionMeta? buildVersionMeta(Object? history, Object? state) {
  final events = <VersionEvent>[];
  if (history is List) {
    for (final entry in history) {
      if (entry is! Map) continue;
      final rawVer = entry['version'];
      final ver = rawVer is String ? parseSpecVersion(rawVer) : null;
      final st = _coerceState(entry['state']);
      if (ver == null || st == null) continue;
      final desc = entry['description'];
      events.add(VersionEvent(
        version: ver,
        rawVersion: rawVer as String,
        state: st,
        description: desc is String ? desc : null,
      ));
    }
  }

  final currentState =
      _coerceState(state) ?? (events.isNotEmpty ? events.last.state : null);
  final addedIn = _firstWhereOrNull(events, (e) => e.state == LifecycleState.added)?.version;
  final deprecatedIn =
      _firstWhereOrNull(events, (e) => e.state == LifecycleState.deprecated)?.version;

  if (events.isEmpty && currentState == null) return null;

  return VersionMeta(
    addedIn: addedIn,
    deprecatedIn: deprecatedIn,
    state: currentState,
    history: events,
  );
}

T? _firstWhereOrNull<T>(List<T> items, bool Function(T) test) {
  for (final item in items) {
    if (test(item)) return item;
  }
  return null;
}
