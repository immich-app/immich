//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

/// Maintenance action
enum MaintenanceAction {
  start._(r'start'),
  end._(r'end'),
  selectDatabaseRestore._(r'select_database_restore'),
  restoreDatabase._(r'restore_database'),
  ;

  /// Instantiate a new enum with the provided value.
  const MaintenanceAction._(this._value);

  /// The underlying value of this enum member.
  final String _value;

  @override
  String toString() => _value;

  /// Encodes this enum as a value suitable for JSON.
  String toJson() => _value;

  /// Returns the instance of [MaintenanceAction] that was successfully decoded
  /// from the passed [value] on success, null otherwise.
  static MaintenanceAction? fromJson(dynamic value) => MaintenanceActionTypeTransformer().decode(value);

  /// Returns a [List] containing instances of [MaintenanceAction]
  /// that were successfully decoded from the passed [JSON][json].
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

  /// Encodes this enum as a value suitable for JSON.
  String encode(MaintenanceAction data) => data._value;

  /// Returns the instance of [MaintenanceAction] that was successfully decoded
  /// from the passed [data] value on success, null otherwise.
  ///
  /// If [allowNull] is true and the [dynamic value][data] cannot be decoded successfully,
  /// then null is returned. However, if [allowNull] is false and the [dynamic value][data]
  /// cannot be decoded successfully, then an [UnimplementedError] is thrown.
  ///
  /// The [allowNull] is very handy when an API changes and a new enum value is added or removed,
  /// and users are still using an old app with the old code.
  MaintenanceAction? decode(dynamic data, {bool allowNull = true}) {
    if (data is MaintenanceAction) {
      return data;
    }
    if (data != null) {
      switch (data) {
        case r'start': return MaintenanceAction.start;
        case r'end': return MaintenanceAction.end;
        case r'select_database_restore': return MaintenanceAction.selectDatabaseRestore;
        case r'restore_database': return MaintenanceAction.restoreDatabase;
        default:
          if (!allowNull) {
            throw ArgumentError('Unknown enum value to decode: $data');
          }
      }
    }
    return null;
  }

  /// The singleton instance of this transformer.
  static MaintenanceActionTypeTransformer? _instance;
}

