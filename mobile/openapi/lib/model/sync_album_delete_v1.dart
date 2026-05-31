// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

final class SyncAlbumDeleteV1 {
  const SyncAlbumDeleteV1({required this.albumId});

  /// Album ID
  final String albumId;

  static SyncAlbumDeleteV1? fromJson(dynamic value) {
    ApiCompat.upgrade<SyncAlbumDeleteV1>(value);
    if (value is! Map) return null;
    final json = value.cast<String, dynamic>();
    return .new(albumId: json[r'albumId'] as String);
  }

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    json[r'albumId'] = albumId;
    return json;
  }

  SyncAlbumDeleteV1 copyWith({String? albumId}) {
    return .new(albumId: albumId ?? this.albumId);
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) || (other is SyncAlbumDeleteV1 && albumId == other.albumId);
  }

  @override
  int get hashCode {
    return Object.hashAll([albumId]);
  }

  @override
  String toString() => 'SyncAlbumDeleteV1(albumId=$albumId)';
}
