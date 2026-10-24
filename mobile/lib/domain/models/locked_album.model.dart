/// Experimental, remote-only group metadata. Never write this to Drift or Store.
class LockedAlbum {
  const LockedAlbum({
    required this.id,
    required this.albumName,
    required this.createdAt,
    required this.updatedAt,
    required this.assetCount,
  });

  final String id;
  final String albumName;
  final DateTime createdAt;
  final DateTime updatedAt;
  final int assetCount;

  factory LockedAlbum.fromJson(Map<String, dynamic> json) => LockedAlbum(
    id: json['id'] as String,
    albumName: json['albumName'] as String,
    createdAt: DateTime.parse(json['createdAt'] as String),
    updatedAt: DateTime.parse(json['updatedAt'] as String),
    assetCount: json['assetCount'] as int,
  );
}

class LockedAlbumAssetPage {
  LockedAlbumAssetPage({required List<String> assetIds, required this.hasNextPage})
    : assetIds = List.unmodifiable(assetIds);

  final List<String> assetIds;
  final bool hasNextPage;

  factory LockedAlbumAssetPage.fromJson(Map<String, dynamic> json) => LockedAlbumAssetPage(
    assetIds: (json['assetIds'] as List).cast<String>(),
    hasNextPage: json['hasNextPage'] as bool,
  );
}

/// Authoritative dates captured once when entering the guarded page. Missing
/// deadlines (including an unbounded session) are not supported by this client.
class LockedAlbumAccess {
  const LockedAlbumAccess({required this.isElevated, required this.expiresAt, required this.pinExpiresAt});

  final bool isElevated;
  final DateTime expiresAt;
  final DateTime pinExpiresAt;

  DateTime get deadline => expiresAt.isBefore(pinExpiresAt) ? expiresAt : pinExpiresAt;

  factory LockedAlbumAccess.fromJson(Map<String, dynamic> json) => LockedAlbumAccess(
    isElevated: json['isElevated'] == true,
    expiresAt: _date(json['expiresAt']),
    pinExpiresAt: _date(json['pinExpiresAt']),
  );

  static DateTime _date(Object? value) {
    // The server emits Date.toISOString(). Require that exact UTC format and
    // round-trip it: DateTime.tryParse alone normalizes invalid calendar dates.
    if (value is! String || !RegExp(r'^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$').hasMatch(value)) {
      throw const FormatException('Missing or invalid private-session deadline');
    }
    final date = DateTime.tryParse(value);
    if (date == null || date.toIso8601String() != value) {
      throw const FormatException('Invalid private-session deadline');
    }
    return date;
  }
}
