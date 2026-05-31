// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

final class AlbumResponseDto {
  const AlbumResponseDto({
    required this.albumName,
    required this.albumThumbnailAssetId,
    required this.albumUsers,
    required this.assetCount,
    this.contributorCounts,
    required this.createdAt,
    required this.description,
    this.endDate,
    required this.hasSharedLink,
    required this.id,
    required this.isActivityEnabled,
    this.lastModifiedAssetTimestamp,
    this.order,
    required this.shared,
    this.startDate,
    required this.updatedAt,
  });

  /// Album name
  final String albumName;

  /// Thumbnail asset ID
  final String? albumThumbnailAssetId;

  /// First entry is always the album owner. Second entry is the auth user, if it differs from the owner. The rest are ordered alphabetically.
  final List<AlbumUserResponseDto> albumUsers;

  /// Number of assets
  final int assetCount;

  final List<ContributorCountResponseDto>? contributorCounts;

  /// Creation date
  final DateTime createdAt;

  /// Album description
  final String description;

  /// End date (latest asset)
  final DateTime? endDate;

  /// Has shared link
  final bool hasSharedLink;

  /// Album ID
  final String id;

  /// Activity feed enabled
  final bool isActivityEnabled;

  /// Last modified asset timestamp
  final DateTime? lastModifiedAssetTimestamp;

  final AssetOrder? order;

  /// Is shared album
  final bool shared;

  /// Start date (earliest asset)
  final DateTime? startDate;

  /// Last update date
  final DateTime updatedAt;

  static const _undefined = Object();

  static AlbumResponseDto? fromJson(dynamic value) {
    ApiCompat.upgrade<AlbumResponseDto>(value);
    if (value is! Map) return null;
    final json = value.cast<String, dynamic>();
    return .new(
      albumName: json[r'albumName'] as String,
      albumThumbnailAssetId: (json[r'albumThumbnailAssetId'] as String?),
      albumUsers: ((json[r'albumUsers'] as List?)
          ?.map(($e) => (AlbumUserResponseDto.fromJson($e))!)
          .toList(growable: false))!,
      assetCount: json[r'assetCount'] as int,
      contributorCounts: (json[r'contributorCounts'] as List?)
          ?.map(($e) => (ContributorCountResponseDto.fromJson($e))!)
          .toList(growable: false),
      createdAt: DateTime.parse(json[r'createdAt'] as String),
      description: json[r'description'] as String,
      endDate: (json[r'endDate'] == null ? null : DateTime.parse(json[r'endDate'] as String)),
      hasSharedLink: json[r'hasSharedLink'] as bool,
      id: json[r'id'] as String,
      isActivityEnabled: json[r'isActivityEnabled'] as bool,
      lastModifiedAssetTimestamp: (json[r'lastModifiedAssetTimestamp'] == null
          ? null
          : DateTime.parse(json[r'lastModifiedAssetTimestamp'] as String)),
      order: AssetOrder.fromJson(json[r'order']),
      shared: json[r'shared'] as bool,
      startDate: (json[r'startDate'] == null ? null : DateTime.parse(json[r'startDate'] as String)),
      updatedAt: DateTime.parse(json[r'updatedAt'] as String),
    );
  }

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    json[r'albumName'] = albumName;
    if (albumThumbnailAssetId != null) {
      json[r'albumThumbnailAssetId'] = albumThumbnailAssetId!;
    }
    json[r'albumUsers'] = albumUsers.map(($e) => $e.toJson()).toList(growable: false);
    json[r'assetCount'] = assetCount;
    if (contributorCounts != null) {
      json[r'contributorCounts'] = contributorCounts!.map(($e) => $e.toJson()).toList(growable: false);
    }
    json[r'createdAt'] = createdAt.toUtc().toIso8601String();
    json[r'description'] = description;
    if (endDate != null) {
      json[r'endDate'] = endDate!.toUtc().toIso8601String();
    }
    json[r'hasSharedLink'] = hasSharedLink;
    json[r'id'] = id;
    json[r'isActivityEnabled'] = isActivityEnabled;
    if (lastModifiedAssetTimestamp != null) {
      json[r'lastModifiedAssetTimestamp'] = lastModifiedAssetTimestamp!.toUtc().toIso8601String();
    }
    if (order != null) {
      json[r'order'] = order!.toJson();
    }
    json[r'shared'] = shared;
    if (startDate != null) {
      json[r'startDate'] = startDate!.toUtc().toIso8601String();
    }
    json[r'updatedAt'] = updatedAt.toUtc().toIso8601String();
    return json;
  }

  AlbumResponseDto copyWith({
    String? albumName,
    Object? albumThumbnailAssetId = _undefined,
    List<AlbumUserResponseDto>? albumUsers,
    int? assetCount,
    Object? contributorCounts = _undefined,
    DateTime? createdAt,
    String? description,
    Object? endDate = _undefined,
    bool? hasSharedLink,
    String? id,
    bool? isActivityEnabled,
    Object? lastModifiedAssetTimestamp = _undefined,
    Object? order = _undefined,
    bool? shared,
    Object? startDate = _undefined,
    DateTime? updatedAt,
  }) {
    return .new(
      albumName: albumName ?? this.albumName,
      albumThumbnailAssetId: identical(albumThumbnailAssetId, _undefined)
          ? this.albumThumbnailAssetId
          : albumThumbnailAssetId as String?,
      albumUsers: albumUsers ?? this.albumUsers,
      assetCount: assetCount ?? this.assetCount,
      contributorCounts: identical(contributorCounts, _undefined)
          ? this.contributorCounts
          : contributorCounts as List<ContributorCountResponseDto>?,
      createdAt: createdAt ?? this.createdAt,
      description: description ?? this.description,
      endDate: identical(endDate, _undefined) ? this.endDate : endDate as DateTime?,
      hasSharedLink: hasSharedLink ?? this.hasSharedLink,
      id: id ?? this.id,
      isActivityEnabled: isActivityEnabled ?? this.isActivityEnabled,
      lastModifiedAssetTimestamp: identical(lastModifiedAssetTimestamp, _undefined)
          ? this.lastModifiedAssetTimestamp
          : lastModifiedAssetTimestamp as DateTime?,
      order: identical(order, _undefined) ? this.order : order as AssetOrder?,
      shared: shared ?? this.shared,
      startDate: identical(startDate, _undefined) ? this.startDate : startDate as DateTime?,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other is AlbumResponseDto &&
            albumName == other.albumName &&
            albumThumbnailAssetId == other.albumThumbnailAssetId &&
            const DeepCollectionEquality().equals(albumUsers, other.albumUsers) &&
            assetCount == other.assetCount &&
            const DeepCollectionEquality().equals(contributorCounts, other.contributorCounts) &&
            createdAt == other.createdAt &&
            description == other.description &&
            endDate == other.endDate &&
            hasSharedLink == other.hasSharedLink &&
            id == other.id &&
            isActivityEnabled == other.isActivityEnabled &&
            lastModifiedAssetTimestamp == other.lastModifiedAssetTimestamp &&
            order == other.order &&
            shared == other.shared &&
            startDate == other.startDate &&
            updatedAt == other.updatedAt);
  }

  @override
  int get hashCode {
    return Object.hashAll([
      albumName,
      albumThumbnailAssetId,
      const DeepCollectionEquality().hash(albumUsers),
      assetCount,
      const DeepCollectionEquality().hash(contributorCounts),
      createdAt,
      description,
      endDate,
      hasSharedLink,
      id,
      isActivityEnabled,
      lastModifiedAssetTimestamp,
      order,
      shared,
      startDate,
      updatedAt,
    ]);
  }

  @override
  String toString() =>
      'AlbumResponseDto(albumName=$albumName, albumThumbnailAssetId=$albumThumbnailAssetId, albumUsers=$albumUsers, assetCount=$assetCount, contributorCounts=$contributorCounts, createdAt=$createdAt, description=$description, endDate=$endDate, hasSharedLink=$hasSharedLink, id=$id, isActivityEnabled=$isActivityEnabled, lastModifiedAssetTimestamp=$lastModifiedAssetTimestamp, order=$order, shared=$shared, startDate=$startDate, updatedAt=$updatedAt)';
}
