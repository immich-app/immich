//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;


class EditAction {
  /// Instantiate a new enum with the provided [value].
  const EditAction._(this.value);

  /// The underlying value of this enum member.
  final String value;

  @override
  String toString() => value;

  String toJson() => value;

  static const crop = EditAction._(r'crop');
  static const rotate = EditAction._(r'rotate');
  static const mirror = EditAction._(r'mirror');

  /// List of all possible values in this [enum][EditAction].
  static const values = <EditAction>[
    crop,
    rotate,
    mirror,
  ];

  static EditAction? fromJson(dynamic value) => EditActionTypeTransformer().decode(value);

  static List<EditAction> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <EditAction>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = EditAction.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }
}

/// Transformation class that can [encode] an instance of [EditAction] to String,
/// and [decode] dynamic data back to [EditAction].
class EditActionTypeTransformer {
  factory EditActionTypeTransformer() => _instance ??= const EditActionTypeTransformer._();

  const EditActionTypeTransformer._();

  String encode(EditAction data) => data.value;

  /// Decodes a [dynamic value][data] to a EditAction.
  ///
  /// If [allowNull] is true and the [dynamic value][data] cannot be decoded successfully,
  /// then null is returned. However, if [allowNull] is false and the [dynamic value][data]
  /// cannot be decoded successfully, then an [UnimplementedError] is thrown.
  ///
  /// The [allowNull] is very handy when an API changes and a new enum value is added or removed,
  /// and users are still using an old app with the old code.
  EditAction? decode(dynamic data, {bool allowNull = true}) {
    if (data != null) {
      switch (data) {
        case r'crop': return EditAction.crop;
        case r'rotate': return EditAction.rotate;
        case r'mirror': return EditAction.mirror;
        default:
          if (!allowNull) {
            throw ArgumentError('Unknown enum value to decode: $data');
          }
      }
    }
    return null;
  }

  /// Singleton [EditActionTypeTransformer] instance.
  static EditActionTypeTransformer? _instance;
}

