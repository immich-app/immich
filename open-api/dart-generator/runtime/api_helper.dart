// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

/// A single `name=value` query-string entry. Both halves are URL-encoded by
/// [toString], so multi-valued params (`?k=a&k=b`) are modeled as repeated
/// [QueryParam]s rather than a `Map`.
class QueryParam {
  const QueryParam(this.name, this.value);

  final String name;
  final String value;

  @override
  String toString() => '${Uri.encodeQueryComponent(name)}=${Uri.encodeQueryComponent(value)}';
}

/// Delimiters for the non-`multi` array [collectionFormat]s.
const _delimiters = <String, String>{'csv': ',', 'ssv': ' ', 'tsv': '\t', 'pipes': '|'};

/// Shared deep-equality used by generated model `==` operators so that `List`,
/// `Set`, and `Map` fields compare by structure rather than identity.
const _deepEquality = DeepCollectionEquality();

/// Expands a parameter [value] into zero or more [QueryParam]s under the given
/// [collectionFormat] (`'multi'`, `'csv'`, `'ssv'`, `'tsv'`, `'pipes'`).
///
/// A `null` value yields no params (the key is omitted); a `List` either repeats
/// the key (`multi`) or joins with the format delimiter; any other value is
/// stringified via [parameterToString].
Iterable<QueryParam> _queryParams(String collectionFormat, String name, dynamic value) {
  assert(name.isNotEmpty, 'Parameter cannot be an empty string.');

  if (value is List) {
    if (collectionFormat == 'multi') {
      return value.map((dynamic v) => QueryParam(name, parameterToString(v)));
    }
    final format = collectionFormat.isEmpty ? 'csv' : collectionFormat;
    final delimiter = _delimiters[format] ?? ',';
    return [QueryParam(name, value.map<String>(parameterToString).join(delimiter))];
  }
  if (value != null) {
    return [QueryParam(name, parameterToString(value))];
  }
  return const [];
}

/// Formats a single parameter [value] for use in a path, query, header, or form
/// field.
///
/// `null` becomes the empty string, `DateTime` is emitted as a UTC ISO-8601
/// string, generated enums delegate to their `toJson()` (the raw wire value),
/// and everything else uses [Object.toString].
String parameterToString(dynamic value) {
  if (value == null) {
    return '';
  }
  if (value is DateTime) {
    return value.toUtc().toIso8601String();
  }
  // Every generated enum is a Dart `enum` exposing `Object toJson()` returning
  // its raw wire value; this keeps the helper free of per-enum branches.
  if (value is Enum) {
    return (value as dynamic).toJson().toString();
  }
  return value.toString();
}

/// Decodes a response body as UTF-8 when the headers declare JSON, otherwise
/// returns the body as already decoded by `package:http`.
Future<String> _decodeBodyBytes(Response response) async {
  final contentType = response.headers['content-type'];
  return contentType != null && contentType.toLowerCase().startsWith('application/json')
      ? (response.bodyBytes.isEmpty ? '' : utf8.decode(response.bodyBytes))
      : response.body;
}

/// Parses a JSON scalar into a [DateTime]: an ISO-8601 string or epoch
/// milliseconds (`int`). Returns `null` when [value] is absent or unparseable.
DateTime? _dateTimeFromJson(Object? value) {
  return switch (value) {
    DateTime() => value,
    String() => DateTime.tryParse(value),
    int() => DateTime.fromMillisecondsSinceEpoch(value, isUtc: true),
    _ => null,
  };
}

/// Widens a JSON number to `double`, tolerating an integer wire value. Returns
/// `null` when [value] is not a number.
double? _toDouble(Object? value) => (value as num?)?.toDouble();

/// Returns the value at [key] of [map] when it is a [T], else `null`.
T? mapValueOfType<T>(dynamic map, String key) {
  final dynamic value = map is Map ? map[key] : null;
  return value is T ? value : null;
}
