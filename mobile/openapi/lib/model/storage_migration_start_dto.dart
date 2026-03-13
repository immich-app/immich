//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class StorageMigrationStartDto {
  /// Returns a new [StorageMigrationStartDto] instance.
  StorageMigrationStartDto({
    this.concurrency = 5,
    this.deleteSource = false,
    required this.direction,
    required this.fileTypes,
  });

  /// Concurrency level
  ///
  /// Minimum value: 1
  /// Maximum value: 20
  int concurrency;

  /// Delete source files after migration
  bool deleteSource;

  /// Migration direction
  StorageMigrationStartDtoDirectionEnum direction;

  /// File types to migrate
  StorageMigrationFileTypesDto fileTypes;

  @override
  bool operator ==(Object other) => identical(this, other) || other is StorageMigrationStartDto &&
    other.concurrency == concurrency &&
    other.deleteSource == deleteSource &&
    other.direction == direction &&
    other.fileTypes == fileTypes;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (concurrency.hashCode) +
    (deleteSource.hashCode) +
    (direction.hashCode) +
    (fileTypes.hashCode);

  @override
  String toString() => 'StorageMigrationStartDto[concurrency=$concurrency, deleteSource=$deleteSource, direction=$direction, fileTypes=$fileTypes]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'concurrency'] = this.concurrency;
      json[r'deleteSource'] = this.deleteSource;
      json[r'direction'] = this.direction;
      json[r'fileTypes'] = this.fileTypes;
    return json;
  }

  /// Returns a new [StorageMigrationStartDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static StorageMigrationStartDto? fromJson(dynamic value) {
    upgradeDto(value, "StorageMigrationStartDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return StorageMigrationStartDto(
        concurrency: mapValueOfType<int>(json, r'concurrency') ?? 5,
        deleteSource: mapValueOfType<bool>(json, r'deleteSource')!,
        direction: StorageMigrationStartDtoDirectionEnum.fromJson(json[r'direction'])!,
        fileTypes: StorageMigrationFileTypesDto.fromJson(json[r'fileTypes'])!,
      );
    }
    return null;
  }

  static List<StorageMigrationStartDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <StorageMigrationStartDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = StorageMigrationStartDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, StorageMigrationStartDto> mapFromJson(dynamic json) {
    final map = <String, StorageMigrationStartDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = StorageMigrationStartDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of StorageMigrationStartDto-objects as value to a dart map
  static Map<String, List<StorageMigrationStartDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<StorageMigrationStartDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = StorageMigrationStartDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'deleteSource',
    'direction',
    'fileTypes',
  };
}

/// Migration direction
class StorageMigrationStartDtoDirectionEnum {
  /// Instantiate a new enum with the provided [value].
  const StorageMigrationStartDtoDirectionEnum._(this.value);

  /// The underlying value of this enum member.
  final String value;

  @override
  String toString() => value;

  String toJson() => value;

  static const toS3 = StorageMigrationStartDtoDirectionEnum._(r'toS3');
  static const toDisk = StorageMigrationStartDtoDirectionEnum._(r'toDisk');

  /// List of all possible values in this [enum][StorageMigrationStartDtoDirectionEnum].
  static const values = <StorageMigrationStartDtoDirectionEnum>[
    toS3,
    toDisk,
  ];

  static StorageMigrationStartDtoDirectionEnum? fromJson(dynamic value) => StorageMigrationStartDtoDirectionEnumTypeTransformer().decode(value);

  static List<StorageMigrationStartDtoDirectionEnum> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <StorageMigrationStartDtoDirectionEnum>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = StorageMigrationStartDtoDirectionEnum.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }
}

/// Transformation class that can [encode] an instance of [StorageMigrationStartDtoDirectionEnum] to String,
/// and [decode] dynamic data back to [StorageMigrationStartDtoDirectionEnum].
class StorageMigrationStartDtoDirectionEnumTypeTransformer {
  factory StorageMigrationStartDtoDirectionEnumTypeTransformer() => _instance ??= const StorageMigrationStartDtoDirectionEnumTypeTransformer._();

  const StorageMigrationStartDtoDirectionEnumTypeTransformer._();

  String encode(StorageMigrationStartDtoDirectionEnum data) => data.value;

  /// Decodes a [dynamic value][data] to a StorageMigrationStartDtoDirectionEnum.
  ///
  /// If [allowNull] is true and the [dynamic value][data] cannot be decoded successfully,
  /// then null is returned. However, if [allowNull] is false and the [dynamic value][data]
  /// cannot be decoded successfully, then an [UnimplementedError] is thrown.
  ///
  /// The [allowNull] is very handy when an API changes and a new enum value is added or removed,
  /// and users are still using an old app with the old code.
  StorageMigrationStartDtoDirectionEnum? decode(dynamic data, {bool allowNull = true}) {
    if (data != null) {
      switch (data) {
        case r'toS3': return StorageMigrationStartDtoDirectionEnum.toS3;
        case r'toDisk': return StorageMigrationStartDtoDirectionEnum.toDisk;
        default:
          if (!allowNull) {
            throw ArgumentError('Unknown enum value to decode: $data');
          }
      }
    }
    return null;
  }

  /// Singleton [StorageMigrationStartDtoDirectionEnumTypeTransformer] instance.
  static StorageMigrationStartDtoDirectionEnumTypeTransformer? _instance;
}


