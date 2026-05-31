/// Pure Dart identifier/casing helpers. No IR knowledge, no I/O — trivially
/// unit-testable. Collision resolution lives in the name registry; this module
/// only produces a *candidate* identifier from a source string.
library;

/// Dart reserved words + built-ins that cannot be used bare as identifiers.
const _reserved = <String>{
  'abstract', 'as', 'assert', 'async', 'await', 'break', 'case', 'catch', 'class',
  'const', 'continue', 'covariant', 'default', 'deferred', 'do', 'dynamic', 'else',
  'enum', 'export', 'extends', 'extension', 'external', 'factory', 'false', 'final',
  'finally', 'for', 'function', 'get', 'hide', 'if', 'implements', 'import', 'in',
  'interface', 'is', 'late', 'library', 'mixin', 'new', 'null', 'on', 'operator',
  'part', 'rethrow', 'return', 'sealed', 'set', 'show', 'static', 'super', 'switch',
  'sync', 'this', 'throw', 'true', 'try', 'typedef', 'var', 'void', 'when', 'while',
  'with', 'yield',
};

final _lowerUpper = RegExp(r'([a-z0-9])([A-Z])');
final _acronymWord = RegExp(r'([A-Z]+)([A-Z][a-z])');
final _separators = RegExp(r'[^a-zA-Z0-9]+');
final _identifier = RegExp(r'^[a-zA-Z_$][a-zA-Z0-9_$]*$');
final _leadingDigit = RegExp(r'^[0-9]');

/// Split an arbitrary string into word tokens on separators and case boundaries.
List<String> tokenize(String input) {
  final spaced = input
      .replaceAllMapped(_lowerUpper, (m) => '${m[1]} ${m[2]}')
      .replaceAllMapped(_acronymWord, (m) => '${m[1]} ${m[2]}');
  return spaced.split(_separators).where((t) => t.isNotEmpty).toList();
}

String _capitalize(String word) =>
    word.isEmpty ? word : word[0].toUpperCase() + word.substring(1);

/// `asset_response_dto` / `asset-response` → `AssetResponseDto`.
String toPascalCase(String input) {
  final id = tokenize(input).map((w) => _capitalize(w.toLowerCase())).join();
  return _ensureIdentifier(id);
}

/// → `assetResponseDto`.
String toCamelCase(String input) {
  final words = tokenize(input);
  if (words.isEmpty) return _ensureIdentifier('');
  final head = words.first.toLowerCase();
  final tail = words.skip(1).map((w) => _capitalize(w.toLowerCase())).join();
  return _escapeReserved(_ensureIdentifier('$head$tail'));
}

/// → `asset_response_dto` (file stems, no extension).
String toSnakeCase(String input) {
  final id = tokenize(input).map((w) => w.toLowerCase()).join('_');
  if (id.isEmpty) return 'value';
  return _leadingDigit.hasMatch(id) ? 'n$id' : id;
}

/// Sanitize an enum wire value into a Dart member identifier.
///
/// Always lowerCamelCase, per Effective Dart — no all-caps exception and no
/// common-prefix stripping (both are openapi-generator behaviours we
/// deliberately drop: `IMAGE` → `image`, `AssetDelete` → `assetDelete`,
/// `on_this_day` → `onThisDay`, `client_secret_post` → `clientSecretPost`).
/// Predictable and stable: adding a value never silently renames the others.
/// Reserved words and leading digits are escaped by [toCamelCase].
String sanitizeEnumMember(Object wireValue) => toCamelCase(wireValue.toString());

bool isValidIdentifier(String s) => _identifier.hasMatch(s);

/// Guarantee a non-empty identifier with a valid leading character.
String _ensureIdentifier(String id) {
  if (id.isEmpty) return 'value';
  return _leadingDigit.hasMatch(id) ? 'n$id' : id;
}

/// Append a `$` so reserved words become legal identifiers.
String _escapeReserved(String id) => _reserved.contains(id) ? '$id\$' : id;
