//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.12

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class AlbumEntity {
  /// Returns a new [AlbumEntity] instance.
  AlbumEntity({
    required this.albumName,
    required this.albumThumbnailAsset,
    required this.albumThumbnailAssetId,
    this.assets = const [],
    required this.createdAt,
    required this.deletedAt,
    required this.description,
    required this.id,
    required this.owner,
    required this.ownerId,
    this.sharedLinks = const [],
    this.sharedUsers = const [],
    required this.updatedAt,
  });

  String albumName;

  AssetEntity? albumThumbnailAsset;

  String? albumThumbnailAssetId;

  List<AssetEntity> assets;

  DateTime createdAt;

  DateTime? deletedAt;

  String description;

  String id;

  UserEntity owner;

  String ownerId;

  List<SharedLinkEntity> sharedLinks;

  List<UserEntity> sharedUsers;

  DateTime updatedAt;

  @override
  bool operator ==(Object other) => identical(this, other) || other is AlbumEntity &&
     other.albumName == albumName &&
     other.albumThumbnailAsset == albumThumbnailAsset &&
     other.albumThumbnailAssetId == albumThumbnailAssetId &&
     other.assets == assets &&
     other.createdAt == createdAt &&
     other.deletedAt == deletedAt &&
     other.description == description &&
     other.id == id &&
     other.owner == owner &&
     other.ownerId == ownerId &&
     other.sharedLinks == sharedLinks &&
     other.sharedUsers == sharedUsers &&
     other.updatedAt == updatedAt;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (albumName.hashCode) +
    (albumThumbnailAsset == null ? 0 : albumThumbnailAsset!.hashCode) +
    (albumThumbnailAssetId == null ? 0 : albumThumbnailAssetId!.hashCode) +
    (assets.hashCode) +
    (createdAt.hashCode) +
    (deletedAt == null ? 0 : deletedAt!.hashCode) +
    (description.hashCode) +
    (id.hashCode) +
    (owner.hashCode) +
    (ownerId.hashCode) +
    (sharedLinks.hashCode) +
    (sharedUsers.hashCode) +
    (updatedAt.hashCode);

  @override
  String toString() => 'AlbumEntity[albumName=$albumName, albumThumbnailAsset=$albumThumbnailAsset, albumThumbnailAssetId=$albumThumbnailAssetId, assets=$assets, createdAt=$createdAt, deletedAt=$deletedAt, description=$description, id=$id, owner=$owner, ownerId=$ownerId, sharedLinks=$sharedLinks, sharedUsers=$sharedUsers, updatedAt=$updatedAt]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'albumName'] = this.albumName;
    if (this.albumThumbnailAsset != null) {
      json[r'albumThumbnailAsset'] = this.albumThumbnailAsset;
    } else {
    //  json[r'albumThumbnailAsset'] = null;
    }
    if (this.albumThumbnailAssetId != null) {
      json[r'albumThumbnailAssetId'] = this.albumThumbnailAssetId;
    } else {
    //  json[r'albumThumbnailAssetId'] = null;
    }
      json[r'assets'] = this.assets;
      json[r'createdAt'] = this.createdAt.toUtc().toIso8601String();
    if (this.deletedAt != null) {
      json[r'deletedAt'] = this.deletedAt!.toUtc().toIso8601String();
    } else {
    //  json[r'deletedAt'] = null;
    }
      json[r'description'] = this.description;
      json[r'id'] = this.id;
      json[r'owner'] = this.owner;
      json[r'ownerId'] = this.ownerId;
      json[r'sharedLinks'] = this.sharedLinks;
      json[r'sharedUsers'] = this.sharedUsers;
      json[r'updatedAt'] = this.updatedAt.toUtc().toIso8601String();
    return json;
  }

  /// Returns a new [AlbumEntity] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static AlbumEntity? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return AlbumEntity(
        albumName: mapValueOfType<String>(json, r'albumName')!,
        albumThumbnailAsset: AssetEntity.fromJson(json[r'albumThumbnailAsset']),
        albumThumbnailAssetId: mapValueOfType<String>(json, r'albumThumbnailAssetId'),
        assets: AssetEntity.listFromJson(json[r'assets']),
        createdAt: mapDateTime(json, r'createdAt', '')!,
        deletedAt: mapDateTime(json, r'deletedAt', ''),
        description: mapValueOfType<String>(json, r'description')!,
        id: mapValueOfType<String>(json, r'id')!,
        owner: UserEntity.fromJson(json[r'owner'])!,
        ownerId: mapValueOfType<String>(json, r'ownerId')!,
        sharedLinks: SharedLinkEntity.listFromJson(json[r'sharedLinks']),
        sharedUsers: UserEntity.listFromJson(json[r'sharedUsers']),
        updatedAt: mapDateTime(json, r'updatedAt', '')!,
      );
    }
    return null;
  }

  static List<AlbumEntity> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <AlbumEntity>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = AlbumEntity.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, AlbumEntity> mapFromJson(dynamic json) {
    final map = <String, AlbumEntity>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = AlbumEntity.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of AlbumEntity-objects as value to a dart map
  static Map<String, List<AlbumEntity>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<AlbumEntity>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = AlbumEntity.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'albumName',
    'albumThumbnailAsset',
    'albumThumbnailAssetId',
    'assets',
    'createdAt',
    'deletedAt',
    'description',
    'id',
    'owner',
    'ownerId',
    'sharedLinks',
    'sharedUsers',
    'updatedAt',
  };
}

