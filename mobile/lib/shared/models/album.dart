import 'package:immich_mobile/shared/models/asset.dart';
import 'package:immich_mobile/shared/models/user.dart';
import 'package:openapi/api.dart';

class Album {
  Album.remote(AlbumResponseDto dto)
      : remoteId = dto.id,
        name = dto.albumName,
        createdAt = DateTime.parse(dto.createdAt),
        // TODO add modifiedAt to server
        modifiedAt = DateTime.parse(dto.createdAt),
        shared = dto.shared,
        ownerId = dto.ownerId,
        albumThumbnailAssetId = dto.albumThumbnailAssetId,
        assetCount = dto.assetCount,
        sharedUsers = dto.sharedUsers.map((e) => User.fromDto(e)).toList(),
        assets = dto.assets.map(Asset.remote).toList();

  Album({
    this.remoteId,
    this.localId,
    required this.name,
    required this.ownerId,
    required this.createdAt,
    required this.modifiedAt,
    required this.shared,
    required this.assetCount,
    this.albumThumbnailAssetId,
    this.sharedUsers = const [],
    this.assets = const [],
  });

  String? remoteId;
  String? localId;
  String name;
  String ownerId;
  DateTime createdAt;
  DateTime modifiedAt;
  bool shared;
  String? albumThumbnailAssetId;
  int assetCount;
  List<User> sharedUsers = const [];
  List<Asset> assets = const [];

  bool get isRemote => remoteId != null;

  bool get isLocal => localId != null;

  String get id => isRemote ? remoteId! : localId!;

  @override
  bool operator ==(other) {
    if (other is! Album) return false;
    return remoteId == other.remoteId &&
        localId == other.localId &&
        name == other.name &&
        createdAt == other.createdAt &&
        modifiedAt == other.modifiedAt &&
        shared == other.shared &&
        ownerId == other.ownerId &&
        albumThumbnailAssetId == other.albumThumbnailAssetId;
  }

  @override
  int get hashCode =>
      remoteId.hashCode ^
      localId.hashCode ^
      name.hashCode ^
      createdAt.hashCode ^
      modifiedAt.hashCode ^
      shared.hashCode ^
      ownerId.hashCode ^
      albumThumbnailAssetId.hashCode;

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    json["remoteId"] = remoteId;
    json["localId"] = localId;
    json["name"] = name;
    json["ownerId"] = ownerId;
    json["createdAt"] = createdAt.millisecondsSinceEpoch;
    json["modifiedAt"] = modifiedAt.millisecondsSinceEpoch;
    json["shared"] = shared;
    json["albumThumbnailAssetId"] = albumThumbnailAssetId;
    json["assetCount"] = assetCount;
    json["sharedUsers"] = sharedUsers;
    json["assets"] = assets;
    return json;
  }

  static Album? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();
      return Album(
        remoteId: json["remoteId"],
        localId: json["localId"],
        name: json["name"],
        ownerId: json["ownerId"],
        createdAt: DateTime.fromMillisecondsSinceEpoch(
          json["createdAt"],
          isUtc: true,
        ),
        modifiedAt: DateTime.fromMillisecondsSinceEpoch(
          json["modifiedAt"],
          isUtc: true,
        ),
        shared: json["shared"],
        albumThumbnailAssetId: json["albumThumbnailAssetId"],
        assetCount: json["assetCount"],
        sharedUsers: _listFromJson<User>(json["sharedUsers"], User.fromJson),
        assets: _listFromJson<Asset>(json["assets"], Asset.fromJson),
      );
    }
    return null;
  }
}

List<T> _listFromJson<T>(
  dynamic json,
  T? Function(dynamic) fromJson,
) {
  final result = <T>[];
  if (json is List && json.isNotEmpty) {
    for (final entry in json) {
      final value = fromJson(entry);
      if (value != null) {
        result.add(value);
      }
    }
  }
  return result;
}
