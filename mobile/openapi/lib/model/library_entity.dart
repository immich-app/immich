//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.12

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class LibraryEntity {
  /// Returns a new [LibraryEntity] instance.
  LibraryEntity({
    this.assets = const [],
    required this.createdAt,
    this.deletedAt,
    this.exclusionPatterns = const [],
    required this.id,
    this.importPaths = const [],
    required this.isVisible,
    required this.name,
    required this.owner,
    required this.ownerId,
    required this.refreshedAt,
    required this.type,
    required this.updatedAt,
  });

  List<AssetEntity> assets;

  DateTime createdAt;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  DateTime? deletedAt;

  List<String> exclusionPatterns;

  String id;

  List<String> importPaths;

  bool isVisible;

  String name;

  UserEntity owner;

  String ownerId;

  DateTime? refreshedAt;

  LibraryEntityTypeEnum type;

  DateTime updatedAt;

  @override
  bool operator ==(Object other) => identical(this, other) || other is LibraryEntity &&
     other.assets == assets &&
     other.createdAt == createdAt &&
     other.deletedAt == deletedAt &&
     other.exclusionPatterns == exclusionPatterns &&
     other.id == id &&
     other.importPaths == importPaths &&
     other.isVisible == isVisible &&
     other.name == name &&
     other.owner == owner &&
     other.ownerId == ownerId &&
     other.refreshedAt == refreshedAt &&
     other.type == type &&
     other.updatedAt == updatedAt;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (assets.hashCode) +
    (createdAt.hashCode) +
    (deletedAt == null ? 0 : deletedAt!.hashCode) +
    (exclusionPatterns.hashCode) +
    (id.hashCode) +
    (importPaths.hashCode) +
    (isVisible.hashCode) +
    (name.hashCode) +
    (owner.hashCode) +
    (ownerId.hashCode) +
    (refreshedAt == null ? 0 : refreshedAt!.hashCode) +
    (type.hashCode) +
    (updatedAt.hashCode);

  @override
  String toString() => 'LibraryEntity[assets=$assets, createdAt=$createdAt, deletedAt=$deletedAt, exclusionPatterns=$exclusionPatterns, id=$id, importPaths=$importPaths, isVisible=$isVisible, name=$name, owner=$owner, ownerId=$ownerId, refreshedAt=$refreshedAt, type=$type, updatedAt=$updatedAt]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'assets'] = this.assets;
      json[r'createdAt'] = this.createdAt.toUtc().toIso8601String();
    if (this.deletedAt != null) {
      json[r'deletedAt'] = this.deletedAt!.toUtc().toIso8601String();
    } else {
    //  json[r'deletedAt'] = null;
    }
      json[r'exclusionPatterns'] = this.exclusionPatterns;
      json[r'id'] = this.id;
      json[r'importPaths'] = this.importPaths;
      json[r'isVisible'] = this.isVisible;
      json[r'name'] = this.name;
      json[r'owner'] = this.owner;
      json[r'ownerId'] = this.ownerId;
    if (this.refreshedAt != null) {
      json[r'refreshedAt'] = this.refreshedAt!.toUtc().toIso8601String();
    } else {
    //  json[r'refreshedAt'] = null;
    }
      json[r'type'] = this.type;
      json[r'updatedAt'] = this.updatedAt.toUtc().toIso8601String();
    return json;
  }

  /// Returns a new [LibraryEntity] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static LibraryEntity? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return LibraryEntity(
        assets: AssetEntity.listFromJson(json[r'assets']),
        createdAt: mapDateTime(json, r'createdAt', '')!,
        deletedAt: mapDateTime(json, r'deletedAt', ''),
        exclusionPatterns: json[r'exclusionPatterns'] is List
            ? (json[r'exclusionPatterns'] as List).cast<String>()
            : const [],
        id: mapValueOfType<String>(json, r'id')!,
        importPaths: json[r'importPaths'] is List
            ? (json[r'importPaths'] as List).cast<String>()
            : const [],
        isVisible: mapValueOfType<bool>(json, r'isVisible')!,
        name: mapValueOfType<String>(json, r'name')!,
        owner: UserEntity.fromJson(json[r'owner'])!,
        ownerId: mapValueOfType<String>(json, r'ownerId')!,
        refreshedAt: mapDateTime(json, r'refreshedAt', ''),
        type: LibraryEntityTypeEnum.fromJson(json[r'type'])!,
        updatedAt: mapDateTime(json, r'updatedAt', '')!,
      );
    }
    return null;
  }

  static List<LibraryEntity> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <LibraryEntity>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = LibraryEntity.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, LibraryEntity> mapFromJson(dynamic json) {
    final map = <String, LibraryEntity>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = LibraryEntity.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of LibraryEntity-objects as value to a dart map
  static Map<String, List<LibraryEntity>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<LibraryEntity>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = LibraryEntity.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'assets',
    'createdAt',
    'exclusionPatterns',
    'id',
    'importPaths',
    'isVisible',
    'name',
    'owner',
    'ownerId',
    'refreshedAt',
    'type',
    'updatedAt',
  };
}


class LibraryEntityTypeEnum {
  /// Instantiate a new enum with the provided [value].
  const LibraryEntityTypeEnum._(this.value);

  /// The underlying value of this enum member.
  final String value;

  @override
  String toString() => value;

  String toJson() => value;

  static const UPLOAD = LibraryEntityTypeEnum._(r'UPLOAD');
  static const EXTERNAL = LibraryEntityTypeEnum._(r'EXTERNAL');

  /// List of all possible values in this [enum][LibraryEntityTypeEnum].
  static const values = <LibraryEntityTypeEnum>[
    UPLOAD,
    EXTERNAL,
  ];

  static LibraryEntityTypeEnum? fromJson(dynamic value) => LibraryEntityTypeEnumTypeTransformer().decode(value);

  static List<LibraryEntityTypeEnum>? listFromJson(dynamic json, {bool growable = false,}) {
    final result = <LibraryEntityTypeEnum>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = LibraryEntityTypeEnum.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }
}

/// Transformation class that can [encode] an instance of [LibraryEntityTypeEnum] to String,
/// and [decode] dynamic data back to [LibraryEntityTypeEnum].
class LibraryEntityTypeEnumTypeTransformer {
  factory LibraryEntityTypeEnumTypeTransformer() => _instance ??= const LibraryEntityTypeEnumTypeTransformer._();

  const LibraryEntityTypeEnumTypeTransformer._();

  String encode(LibraryEntityTypeEnum data) => data.value;

  /// Decodes a [dynamic value][data] to a LibraryEntityTypeEnum.
  ///
  /// If [allowNull] is true and the [dynamic value][data] cannot be decoded successfully,
  /// then null is returned. However, if [allowNull] is false and the [dynamic value][data]
  /// cannot be decoded successfully, then an [UnimplementedError] is thrown.
  ///
  /// The [allowNull] is very handy when an API changes and a new enum value is added or removed,
  /// and users are still using an old app with the old code.
  LibraryEntityTypeEnum? decode(dynamic data, {bool allowNull = true}) {
    if (data != null) {
      switch (data) {
        case r'UPLOAD': return LibraryEntityTypeEnum.UPLOAD;
        case r'EXTERNAL': return LibraryEntityTypeEnum.EXTERNAL;
        default:
          if (!allowNull) {
            throw ArgumentError('Unknown enum value to decode: $data');
          }
      }
    }
    return null;
  }

  /// Singleton [LibraryEntityTypeEnumTypeTransformer] instance.
  static LibraryEntityTypeEnumTypeTransformer? _instance;
}


