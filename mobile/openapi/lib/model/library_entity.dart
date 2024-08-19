//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

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
    required this.name,
    required this.owner,
    required this.ownerId,
    required this.refreshedAt,
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

  String name;

  UserEntity owner;

  String ownerId;

  DateTime? refreshedAt;

  DateTime updatedAt;

  @override
  bool operator ==(Object other) => identical(this, other) || other is LibraryEntity &&
    _deepEquality.equals(other.assets, assets) &&
    other.createdAt == createdAt &&
    other.deletedAt == deletedAt &&
    _deepEquality.equals(other.exclusionPatterns, exclusionPatterns) &&
    other.id == id &&
    _deepEquality.equals(other.importPaths, importPaths) &&
    other.name == name &&
    other.owner == owner &&
    other.ownerId == ownerId &&
    other.refreshedAt == refreshedAt &&
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
    (name.hashCode) +
    (owner.hashCode) +
    (ownerId.hashCode) +
    (refreshedAt == null ? 0 : refreshedAt!.hashCode) +
    (updatedAt.hashCode);

  @override
  String toString() => 'LibraryEntity[assets=$assets, createdAt=$createdAt, deletedAt=$deletedAt, exclusionPatterns=$exclusionPatterns, id=$id, importPaths=$importPaths, name=$name, owner=$owner, ownerId=$ownerId, refreshedAt=$refreshedAt, updatedAt=$updatedAt]';

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
      json[r'name'] = this.name;
      json[r'owner'] = this.owner;
      json[r'ownerId'] = this.ownerId;
    if (this.refreshedAt != null) {
      json[r'refreshedAt'] = this.refreshedAt!.toUtc().toIso8601String();
    } else {
    //  json[r'refreshedAt'] = null;
    }
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
        createdAt: mapDateTime(json, r'createdAt', r'')!,
        deletedAt: mapDateTime(json, r'deletedAt', r''),
        exclusionPatterns: json[r'exclusionPatterns'] is Iterable
            ? (json[r'exclusionPatterns'] as Iterable).cast<String>().toList(growable: false)
            : const [],
        id: mapValueOfType<String>(json, r'id')!,
        importPaths: json[r'importPaths'] is Iterable
            ? (json[r'importPaths'] as Iterable).cast<String>().toList(growable: false)
            : const [],
        name: mapValueOfType<String>(json, r'name')!,
        owner: UserEntity.fromJson(json[r'owner'])!,
        ownerId: mapValueOfType<String>(json, r'ownerId')!,
        refreshedAt: mapDateTime(json, r'refreshedAt', r''),
        updatedAt: mapDateTime(json, r'updatedAt', r'')!,
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
    'name',
    'owner',
    'ownerId',
    'refreshedAt',
    'updatedAt',
  };
}

