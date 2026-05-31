// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

/// Suggestion type
enum SearchSuggestionType {
  country._(r'country'),
  state._(r'state'),
  city._(r'city'),
  cameraMake._(r'camera-make'),
  cameraModel._(r'camera-model'),
  cameraLensModel._(r'camera-lens-model'),

  /// Reserved for values from newer servers. Never sent by this client.
  valueUnknown._(r'__unknown__');

  const SearchSuggestionType._(this.value);

  final String value;

  static SearchSuggestionType? fromJson(dynamic value) {
    for (final e in values) {
      if (e.value == value) return e;
    }
    return value == null ? null : valueUnknown;
  }

  Object toJson() => value;

  @override
  String toString() => value.toString();
}
