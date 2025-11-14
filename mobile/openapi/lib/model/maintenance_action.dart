//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;


class MaintenanceAction {
  /// Instantiate a new enum with the provided [value].
  const MaintenanceAction._(this.value);

  /// The underlying value of this enum member.
  final String value;

  @override
  String toString() => value;

  String toJson() => value;

  static const start = MaintenanceAction._(r'start');
  static const end = MaintenanceAction._(r'end');

  /// List of all possible values in this [enum][MaintenanceAction].
  static const values = <MaintenanceAction>[
    start,
    end,
  ];

  static MaintenanceAction? fromJson(dynamic value) => MaintenanceActionTypeTransformer().decode(value);

  static List<MaintenanceAction> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <MaintenanceAction>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = MaintenanceAction.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }
}

/// Transformation class that can [encode] an instance of [MaintenanceAction] to String,
/// and [decode] dynamic data back to [MaintenanceAction].
class MaintenanceActionTypeTransformer {
  factory MaintenanceActionTypeTransformer() => _instance ??= const MaintenanceActionTypeTransformer._();

  const MaintenanceActionTypeTransformer._();

  String encode(MaintenanceAction data) => data.value;

  /// Decodes a [dynamic value][data] to a MaintenanceAction.
  ///
  /// If [allowNull] is true and the [dynamic value][data] cannot be decoded successfully,
  /// then null is returned. However, if [allowNull] is false and the [dynamic value][data]
  /// cannot be decoded successfully, then an [UnimplementedError] is thrown.
  ///
  /// The [allowNull] is very handy when an API changes and a new enum value is added or removed,
  /// and users are still using an old app with the old code.
  MaintenanceAction? decode(dynamic data, {bool allowNull = true}) {
    if (data != null) {
      switch (data) {
        case r'start': return MaintenanceAction.start;
        case r'end': return MaintenanceAction.end;
        default:
          if (!allowNull) {
            throw ArgumentError('Unknown enum value to decode: $data');
          }
      }
    }
    return null;
  }

  /// Singleton [MaintenanceActionTypeTransformer] instance.
  static MaintenanceActionTypeTransformer? _instance;
}

