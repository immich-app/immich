//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.12

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class TagEntity {
  /// Returns a new [TagEntity] instance.
  TagEntity({
    required this.id,
    required this.type,
    required this.name,
    required this.userId,
    required this.renameTagId,
    this.assets = const [],
    required this.user,
  });

  String id;

  TagEntityTypeEnum type;

  String name;

  String userId;

  String renameTagId;

  List<AssetEntity> assets;

  UserEntity user;

  @override
  bool operator ==(Object other) => identical(this, other) || other is TagEntity &&
     other.id == id &&
     other.type == type &&
     other.name == name &&
     other.userId == userId &&
     other.renameTagId == renameTagId &&
     other.assets == assets &&
     other.user == user;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (id.hashCode) +
    (type.hashCode) +
    (name.hashCode) +
    (userId.hashCode) +
    (renameTagId.hashCode) +
    (assets.hashCode) +
    (user.hashCode);

  @override
  String toString() => 'TagEntity[id=$id, type=$type, name=$name, userId=$userId, renameTagId=$renameTagId, assets=$assets, user=$user]';

  Map<String, dynamic> toJson() {
    final _json = <String, dynamic>{};
      _json[r'id'] = id;
      _json[r'type'] = type;
      _json[r'name'] = name;
      _json[r'userId'] = userId;
      _json[r'renameTagId'] = renameTagId;
      _json[r'assets'] = assets;
      _json[r'user'] = user;
    return _json;
  }

  /// Returns a new [TagEntity] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static TagEntity? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      // Ensure that the map contains the required keys.
      // Note 1: the values aren't checked for validity beyond being non-null.
      // Note 2: this code is stripped in release mode!
      assert(() {
        requiredKeys.forEach((key) {
          assert(json.containsKey(key), 'Required key "TagEntity[$key]" is missing from JSON.');
          assert(json[key] != null, 'Required key "TagEntity[$key]" has a null value in JSON.');
        });
        return true;
      }());

      return TagEntity(
        id: mapValueOfType<String>(json, r'id')!,
        type: TagEntityTypeEnum.fromJson(json[r'type'])!,
        name: mapValueOfType<String>(json, r'name')!,
        userId: mapValueOfType<String>(json, r'userId')!,
        renameTagId: mapValueOfType<String>(json, r'renameTagId')!,
        assets: AssetEntity.listFromJson(json[r'assets'])!,
        user: UserEntity.fromJson(json[r'user'])!,
      );
    }
    return null;
  }

  static List<TagEntity>? listFromJson(dynamic json, {bool growable = false,}) {
    final result = <TagEntity>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = TagEntity.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, TagEntity> mapFromJson(dynamic json) {
    final map = <String, TagEntity>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = TagEntity.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of TagEntity-objects as value to a dart map
  static Map<String, List<TagEntity>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<TagEntity>>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = TagEntity.listFromJson(entry.value, growable: growable,);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'id',
    'type',
    'name',
    'userId',
    'renameTagId',
    'assets',
    'user',
  };
}


class TagEntityTypeEnum {
  /// Instantiate a new enum with the provided [value].
  const TagEntityTypeEnum._(this.value);

  /// The underlying value of this enum member.
  final String value;

  @override
  String toString() => value;

  String toJson() => value;

  static const OBJECT = TagEntityTypeEnum._(r'OBJECT');
  static const FACE = TagEntityTypeEnum._(r'FACE');
  static const CUSTOM = TagEntityTypeEnum._(r'CUSTOM');

  /// List of all possible values in this [enum][TagEntityTypeEnum].
  static const values = <TagEntityTypeEnum>[
    OBJECT,
    FACE,
    CUSTOM,
  ];

  static TagEntityTypeEnum? fromJson(dynamic value) => TagEntityTypeEnumTypeTransformer().decode(value);

  static List<TagEntityTypeEnum>? listFromJson(dynamic json, {bool growable = false,}) {
    final result = <TagEntityTypeEnum>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = TagEntityTypeEnum.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }
}

/// Transformation class that can [encode] an instance of [TagEntityTypeEnum] to String,
/// and [decode] dynamic data back to [TagEntityTypeEnum].
class TagEntityTypeEnumTypeTransformer {
  factory TagEntityTypeEnumTypeTransformer() => _instance ??= const TagEntityTypeEnumTypeTransformer._();

  const TagEntityTypeEnumTypeTransformer._();

  String encode(TagEntityTypeEnum data) => data.value;

  /// Decodes a [dynamic value][data] to a TagEntityTypeEnum.
  ///
  /// If [allowNull] is true and the [dynamic value][data] cannot be decoded successfully,
  /// then null is returned. However, if [allowNull] is false and the [dynamic value][data]
  /// cannot be decoded successfully, then an [UnimplementedError] is thrown.
  ///
  /// The [allowNull] is very handy when an API changes and a new enum value is added or removed,
  /// and users are still using an old app with the old code.
  TagEntityTypeEnum? decode(dynamic data, {bool allowNull = true}) {
    if (data != null) {
      switch (data.toString()) {
        case r'OBJECT': return TagEntityTypeEnum.OBJECT;
        case r'FACE': return TagEntityTypeEnum.FACE;
        case r'CUSTOM': return TagEntityTypeEnum.CUSTOM;
        default:
          if (!allowNull) {
            throw ArgumentError('Unknown enum value to decode: $data');
          }
      }
    }
    return null;
  }

  /// Singleton [TagEntityTypeEnumTypeTransformer] instance.
  static TagEntityTypeEnumTypeTransformer? _instance;
}


