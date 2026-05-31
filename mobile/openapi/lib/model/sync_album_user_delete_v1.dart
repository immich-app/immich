// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

final class SyncAlbumUserDeleteV1 {
  const SyncAlbumUserDeleteV1({required this.albumId, required this.userId});

  /// Album ID
  final String albumId;

  /// User ID
  final String userId;

  static SyncAlbumUserDeleteV1? fromJson(dynamic value) {
    ApiCompat.upgrade<SyncAlbumUserDeleteV1>(value);
    if (value is! Map) return null;
    final json = value.cast<String, dynamic>();
    return .new(albumId: json[r'albumId'] as String, userId: json[r'userId'] as String);
  }

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    json[r'albumId'] = albumId;
    json[r'userId'] = userId;
    return json;
  }

  SyncAlbumUserDeleteV1 copyWith({String? albumId, String? userId}) {
    return .new(albumId: albumId ?? this.albumId, userId: userId ?? this.userId);
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other is SyncAlbumUserDeleteV1 && albumId == other.albumId && userId == other.userId);
  }

  @override
  int get hashCode {
    return Object.hashAll([albumId, userId]);
  }

  @override
  String toString() => 'SyncAlbumUserDeleteV1(albumId=$albumId, userId=$userId)';
}
