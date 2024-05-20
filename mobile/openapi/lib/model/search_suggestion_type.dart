//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;


class SearchSuggestionType {
  /// Instantiate a new enum with the provided [value].
  const SearchSuggestionType._(this.value);

  /// The underlying value of this enum member.
  final String value;

  @override
  String toString() => value;

  String toJson() => value;

  static const country = SearchSuggestionType._(r'country');
  static const state = SearchSuggestionType._(r'state');
  static const city = SearchSuggestionType._(r'city');
  static const cameraMake = SearchSuggestionType._(r'camera-make');
  static const cameraModel = SearchSuggestionType._(r'camera-model');

  /// List of all possible values in this [enum][SearchSuggestionType].
  static const values = <SearchSuggestionType>[
    country,
    state,
    city,
    cameraMake,
    cameraModel,
  ];

  static SearchSuggestionType? fromJson(dynamic value) => SearchSuggestionTypeTypeTransformer().decode(value);

  static List<SearchSuggestionType> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <SearchSuggestionType>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = SearchSuggestionType.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }
}

/// Transformation class that can [encode] an instance of [SearchSuggestionType] to String,
/// and [decode] dynamic data back to [SearchSuggestionType].
class SearchSuggestionTypeTypeTransformer {
  factory SearchSuggestionTypeTypeTransformer() => _instance ??= const SearchSuggestionTypeTypeTransformer._();

  const SearchSuggestionTypeTypeTransformer._();

  String encode(SearchSuggestionType data) => data.value;

  /// Decodes a [dynamic value][data] to a SearchSuggestionType.
  ///
  /// If [allowNull] is true and the [dynamic value][data] cannot be decoded successfully,
  /// then null is returned. However, if [allowNull] is false and the [dynamic value][data]
  /// cannot be decoded successfully, then an [UnimplementedError] is thrown.
  ///
  /// The [allowNull] is very handy when an API changes and a new enum value is added or removed,
  /// and users are still using an old app with the old code.
  SearchSuggestionType? decode(dynamic data, {bool allowNull = true}) {
    if (data != null) {
      switch (data) {
        case r'country': return SearchSuggestionType.country;
        case r'state': return SearchSuggestionType.state;
        case r'city': return SearchSuggestionType.city;
        case r'camera-make': return SearchSuggestionType.cameraMake;
        case r'camera-model': return SearchSuggestionType.cameraModel;
        default:
          if (!allowNull) {
            throw ArgumentError('Unknown enum value to decode: $data');
          }
      }
    }
    return null;
  }

  /// Singleton [SearchSuggestionTypeTypeTransformer] instance.
  static SearchSuggestionTypeTypeTransformer? _instance;
}

