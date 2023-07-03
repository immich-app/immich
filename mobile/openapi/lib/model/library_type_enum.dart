//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.12

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;


class LibraryTypeEnum {
  /// Instantiate a new enum with the provided [value].
  const LibraryTypeEnum._(this.value);

  /// The underlying value of this enum member.
  final String value;

  @override
  String toString() => value;

  String toJson() => value;

  static const UPLOAD = LibraryTypeEnum._(r'UPLOAD');
  static const IMPORT = LibraryTypeEnum._(r'IMPORT');

  /// List of all possible values in this [enum][LibraryTypeEnum].
  static const values = <LibraryTypeEnum>[
    UPLOAD,
    IMPORT,
  ];

  static LibraryTypeEnum? fromJson(dynamic value) => LibraryTypeEnumTypeTransformer().decode(value);

  static List<LibraryTypeEnum>? listFromJson(dynamic json, {bool growable = false,}) {
    final result = <LibraryTypeEnum>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = LibraryTypeEnum.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }
}

/// Transformation class that can [encode] an instance of [LibraryTypeEnum] to String,
/// and [decode] dynamic data back to [LibraryTypeEnum].
class LibraryTypeEnumTypeTransformer {
  factory LibraryTypeEnumTypeTransformer() => _instance ??= const LibraryTypeEnumTypeTransformer._();

  const LibraryTypeEnumTypeTransformer._();

  String encode(LibraryTypeEnum data) => data.value;

  /// Decodes a [dynamic value][data] to a LibraryTypeEnum.
  ///
  /// If [allowNull] is true and the [dynamic value][data] cannot be decoded successfully,
  /// then null is returned. However, if [allowNull] is false and the [dynamic value][data]
  /// cannot be decoded successfully, then an [UnimplementedError] is thrown.
  ///
  /// The [allowNull] is very handy when an API changes and a new enum value is added or removed,
  /// and users are still using an old app with the old code.
  LibraryTypeEnum? decode(dynamic data, {bool allowNull = true}) {
    if (data != null) {
      switch (data) {
        case r'UPLOAD': return LibraryTypeEnum.UPLOAD;
        case r'IMPORT': return LibraryTypeEnum.IMPORT;
        default:
          if (!allowNull) {
            throw ArgumentError('Unknown enum value to decode: $data');
          }
      }
    }
    return null;
  }

  /// Singleton [LibraryTypeEnumTypeTransformer] instance.
  static LibraryTypeEnumTypeTransformer? _instance;
}

