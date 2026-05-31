// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// Backward-compatibility mechanism. The generated client owns this hook but
// knows NO rules; the host app supplies them at startup, so the dependency
// flows app -> client only (this file has no app imports).
part of openapi.api;

/// One backward-compatibility default: when the wire JSON omits [path]
/// (dot-separated, e.g. `'download.includeEmbeddedVideos'`), fill it with
/// [value] before the DTO is parsed.
///
/// The constructor is `const`, so rule sets built entirely from static values
/// can be `const`; sets that need a DTO's `toJson()` or `DateTime.now()` are
/// plain (those values are computed when the rule set is built at startup).
final class JsonDefault {
  /// The dot-separated wire path to back-fill.
  final String path;

  /// The value to set when [path] is absent or null.
  final Object? value;

  const JsonDefault(this.path, this.value);
}

/// Registry of per-DTO backward-compatibility defaults, keyed by the DTO [Type]
/// for compile-time safety.
///
/// Newer DTOs may declare fields that older servers don't send. Each model's
/// `fromJson` calls [upgrade] with its own type before parsing; the host app's
/// registered defaults fill any missing fields so deserialization tolerates
/// older servers.
///
/// Configured once at startup, keyed by DTO type so a renamed/removed DTO is a
/// compile error. Static-only entries can be `const` lists:
///
/// ```dart
/// ApiCompat.configure({
///   AssetResponseDto: const [
///     JsonDefault('visibility', 'timeline'),
///     JsonDefault('isEdited', false),
///   ],
/// });
/// ```
abstract final class ApiCompat {
  ApiCompat._();

  static Map<Type, List<JsonDefault>> _defaults = const <Type, List<JsonDefault>>{};

  /// Install the backward-compat rule set (replaces any previous one).
  static void configure(Map<Type, List<JsonDefault>> defaults) {
    _defaults = defaults;
  }

  /// Clear all rules. Intended for test isolation.
  static void reset() {
    _defaults = const <Type, List<JsonDefault>>{};
  }

  /// Apply the registered defaults for DTO type [T] to [json], if any. Called
  /// by every generated `fromJson`; a no-op when [json] is not a map or no
  /// rules are registered for [T].
  static void upgrade<T>(Object? json) {
    if (json is! Map<String, dynamic>) return;
    final defaults = _defaults[T];
    if (defaults == null) return;
    for (final entry in defaults) {
      _putDefault(json, entry.path, entry.value);
    }
  }

  /// Set [keyPath] (dot-separated) to [value] only when currently absent/null,
  /// creating intermediate maps as needed.
  static void _putDefault(Map<String, dynamic> json, String keyPath, Object? value) {
    final keys = keyPath.split('.');
    var node = json;
    for (var i = 0; i < keys.length - 1; i++) {
      final existing = node[keys[i]];
      if (existing is Map<String, dynamic>) {
        node = existing;
      } else {
        final created = <String, dynamic>{};
        node[keys[i]] = created;
        node = created;
      }
    }
    if (node[keys.last] == null) {
      node[keys.last] = value;
    }
  }
}
