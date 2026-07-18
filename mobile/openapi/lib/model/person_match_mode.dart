//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

/// Match all selected people (AND) or any selected person (OR). Defaults to all.
class PersonMatchMode {
  /// Instantiate a new enum with the provided [value].
  const PersonMatchMode._(this.value);

  /// The underlying value of this enum member.
  final String value;

  @override
  String toString() => value;

  String toJson() => value;

  static const all = PersonMatchMode._(r'all');
  static const any = PersonMatchMode._(r'any');

  /// List of all possible values in this [enum][PersonMatchMode].
  static const values = <PersonMatchMode>[
    all,
    any,
  ];

  static PersonMatchMode? fromJson(dynamic value) => PersonMatchModeTypeTransformer().decode(value);

  static List<PersonMatchMode> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <PersonMatchMode>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = PersonMatchMode.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }
}

/// Transformation class that can [encode] an instance of [PersonMatchMode] to String,
/// and [decode] dynamic data back to [PersonMatchMode].
class PersonMatchModeTypeTransformer {
  factory PersonMatchModeTypeTransformer() => _instance ??= const PersonMatchModeTypeTransformer._();

  const PersonMatchModeTypeTransformer._();

  String encode(PersonMatchMode data) => data.value;

  /// Decodes a [dynamic value][data] to a PersonMatchMode.
  ///
  /// Returns null if [data] cannot be decoded to a PersonMatchMode.
  PersonMatchMode? decode(dynamic data) {
    if (data is! String) {
      return null;
    }
    switch (data) {
      case r'all': return PersonMatchMode.all;
      case r'any': return PersonMatchMode.any;
      default: return null;
    }
  }

  static PersonMatchModeTypeTransformer? _instance;
}
