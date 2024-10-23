//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class SyncStreamResponseDtoData {
  /// Returns a new [SyncStreamResponseDtoData] instance.
  SyncStreamResponseDtoData({
    required this.checksum,
    required this.deviceAssetId,
    required this.deviceId,
    this.duplicateId,
    required this.duration,
    this.exifInfo,
    required this.fileCreatedAt,
    required this.fileModifiedAt,
    required this.hasMetadata,
    required this.id,
    required this.isArchived,
    required this.isFavorite,
    required this.isOffline,
    required this.isTrashed,
    this.libraryId,
    this.livePhotoVideoId,
    required this.localDateTime,
    required this.originalFileName,
    this.originalMimeType,
    required this.originalPath,
    required this.owner,
    required this.ownerId,
    this.people = const [],
    this.resized,
    this.smartInfo,
    this.stack,
    this.tags = const [],
    required this.thumbhash,
    required this.type,
    this.unassignedFaces = const [],
    required this.updatedAt,
    required this.albumName,
    required this.albumThumbnailAssetId,
    this.albumUsers = const [],
    required this.assetCount,
    this.assets = const [],
    required this.createdAt,
    required this.description,
    this.endDate,
    required this.hasSharedLink,
    required this.isActivityEnabled,
    this.lastModifiedAssetTimestamp,
    this.order,
    required this.shared,
    this.startDate,
    required this.albumId,
    required this.assetId,
    this.comment,
    required this.user,
    required this.data,
    this.deletedAt,
    required this.isSaved,
    required this.memoryAt,
    this.seenAt,
    required this.avatarColor,
    required this.email,
    this.inTimeline,
    required this.name,
    required this.profileChangedAt,
    required this.profileImagePath,
    required this.birthDate,
    required this.isHidden,
    required this.thumbnailPath,
    this.album,
    required this.allowDownload,
    required this.allowUpload,
    required this.expiresAt,
    required this.key,
    required this.password,
    required this.showMetadata,
    this.token,
    required this.userId,
    required this.primaryAssetId,
  });

  /// base64 encoded sha1 hash
  String checksum;

  String deviceAssetId;

  String deviceId;

  String? duplicateId;

  String duration;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  ExifResponseDto? exifInfo;

  DateTime fileCreatedAt;

  DateTime fileModifiedAt;

  bool hasMetadata;

  String id;

  bool isArchived;

  bool isFavorite;

  bool isOffline;

  bool isTrashed;

  /// This property was deprecated in v1.106.0
  String? libraryId;

  String? livePhotoVideoId;

  DateTime localDateTime;

  String originalFileName;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  String? originalMimeType;

  String originalPath;

  UserResponseDto owner;

  String ownerId;

  List<PersonWithFacesResponseDto> people;

  /// This property was deprecated in v1.113.0
  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  bool? resized;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  SmartInfoResponseDto? smartInfo;

  AssetStackResponseDto? stack;

  List<TagResponseDto> tags;

  String? thumbhash;

  SharedLinkType type;

  List<AssetFaceWithoutPersonResponseDto> unassignedFaces;

  /// This property was added in v1.107.0
  DateTime updatedAt;

  String albumName;

  String? albumThumbnailAssetId;

  List<AlbumUserResponseDto> albumUsers;

  int assetCount;

  List<AssetResponseDto> assets;

  DateTime createdAt;

  String? description;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  DateTime? endDate;

  bool hasSharedLink;

  bool isActivityEnabled;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  DateTime? lastModifiedAssetTimestamp;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  AssetOrder? order;

  bool shared;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  DateTime? startDate;

  String albumId;

  String? assetId;

  String? comment;

  UserResponseDto user;

  OnThisDayDto data;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  DateTime? deletedAt;

  bool isSaved;

  DateTime memoryAt;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  DateTime? seenAt;

  UserAvatarColor avatarColor;

  String email;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  bool? inTimeline;

  String name;

  DateTime profileChangedAt;

  String profileImagePath;

  DateTime? birthDate;

  bool isHidden;

  String thumbnailPath;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  AlbumResponseDto? album;

  bool allowDownload;

  bool allowUpload;

  DateTime? expiresAt;

  String key;

  String? password;

  bool showMetadata;

  String? token;

  String userId;

  String primaryAssetId;

  @override
  bool operator ==(Object other) => identical(this, other) || other is SyncStreamResponseDtoData &&
    other.checksum == checksum &&
    other.deviceAssetId == deviceAssetId &&
    other.deviceId == deviceId &&
    other.duplicateId == duplicateId &&
    other.duration == duration &&
    other.exifInfo == exifInfo &&
    other.fileCreatedAt == fileCreatedAt &&
    other.fileModifiedAt == fileModifiedAt &&
    other.hasMetadata == hasMetadata &&
    other.id == id &&
    other.isArchived == isArchived &&
    other.isFavorite == isFavorite &&
    other.isOffline == isOffline &&
    other.isTrashed == isTrashed &&
    other.libraryId == libraryId &&
    other.livePhotoVideoId == livePhotoVideoId &&
    other.localDateTime == localDateTime &&
    other.originalFileName == originalFileName &&
    other.originalMimeType == originalMimeType &&
    other.originalPath == originalPath &&
    other.owner == owner &&
    other.ownerId == ownerId &&
    _deepEquality.equals(other.people, people) &&
    other.resized == resized &&
    other.smartInfo == smartInfo &&
    other.stack == stack &&
    _deepEquality.equals(other.tags, tags) &&
    other.thumbhash == thumbhash &&
    other.type == type &&
    _deepEquality.equals(other.unassignedFaces, unassignedFaces) &&
    other.updatedAt == updatedAt &&
    other.albumName == albumName &&
    other.albumThumbnailAssetId == albumThumbnailAssetId &&
    _deepEquality.equals(other.albumUsers, albumUsers) &&
    other.assetCount == assetCount &&
    _deepEquality.equals(other.assets, assets) &&
    other.createdAt == createdAt &&
    other.description == description &&
    other.endDate == endDate &&
    other.hasSharedLink == hasSharedLink &&
    other.isActivityEnabled == isActivityEnabled &&
    other.lastModifiedAssetTimestamp == lastModifiedAssetTimestamp &&
    other.order == order &&
    other.shared == shared &&
    other.startDate == startDate &&
    other.albumId == albumId &&
    other.assetId == assetId &&
    other.comment == comment &&
    other.user == user &&
    other.data == data &&
    other.deletedAt == deletedAt &&
    other.isSaved == isSaved &&
    other.memoryAt == memoryAt &&
    other.seenAt == seenAt &&
    other.avatarColor == avatarColor &&
    other.email == email &&
    other.inTimeline == inTimeline &&
    other.name == name &&
    other.profileChangedAt == profileChangedAt &&
    other.profileImagePath == profileImagePath &&
    other.birthDate == birthDate &&
    other.isHidden == isHidden &&
    other.thumbnailPath == thumbnailPath &&
    other.album == album &&
    other.allowDownload == allowDownload &&
    other.allowUpload == allowUpload &&
    other.expiresAt == expiresAt &&
    other.key == key &&
    other.password == password &&
    other.showMetadata == showMetadata &&
    other.token == token &&
    other.userId == userId &&
    other.primaryAssetId == primaryAssetId;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (checksum.hashCode) +
    (deviceAssetId.hashCode) +
    (deviceId.hashCode) +
    (duplicateId == null ? 0 : duplicateId!.hashCode) +
    (duration.hashCode) +
    (exifInfo == null ? 0 : exifInfo!.hashCode) +
    (fileCreatedAt.hashCode) +
    (fileModifiedAt.hashCode) +
    (hasMetadata.hashCode) +
    (id.hashCode) +
    (isArchived.hashCode) +
    (isFavorite.hashCode) +
    (isOffline.hashCode) +
    (isTrashed.hashCode) +
    (libraryId == null ? 0 : libraryId!.hashCode) +
    (livePhotoVideoId == null ? 0 : livePhotoVideoId!.hashCode) +
    (localDateTime.hashCode) +
    (originalFileName.hashCode) +
    (originalMimeType == null ? 0 : originalMimeType!.hashCode) +
    (originalPath.hashCode) +
    (owner.hashCode) +
    (ownerId.hashCode) +
    (people.hashCode) +
    (resized == null ? 0 : resized!.hashCode) +
    (smartInfo == null ? 0 : smartInfo!.hashCode) +
    (stack == null ? 0 : stack!.hashCode) +
    (tags.hashCode) +
    (thumbhash == null ? 0 : thumbhash!.hashCode) +
    (type.hashCode) +
    (unassignedFaces.hashCode) +
    (updatedAt.hashCode) +
    (albumName.hashCode) +
    (albumThumbnailAssetId == null ? 0 : albumThumbnailAssetId!.hashCode) +
    (albumUsers.hashCode) +
    (assetCount.hashCode) +
    (assets.hashCode) +
    (createdAt.hashCode) +
    (description == null ? 0 : description!.hashCode) +
    (endDate == null ? 0 : endDate!.hashCode) +
    (hasSharedLink.hashCode) +
    (isActivityEnabled.hashCode) +
    (lastModifiedAssetTimestamp == null ? 0 : lastModifiedAssetTimestamp!.hashCode) +
    (order == null ? 0 : order!.hashCode) +
    (shared.hashCode) +
    (startDate == null ? 0 : startDate!.hashCode) +
    (albumId.hashCode) +
    (assetId == null ? 0 : assetId!.hashCode) +
    (comment == null ? 0 : comment!.hashCode) +
    (user.hashCode) +
    (data.hashCode) +
    (deletedAt == null ? 0 : deletedAt!.hashCode) +
    (isSaved.hashCode) +
    (memoryAt.hashCode) +
    (seenAt == null ? 0 : seenAt!.hashCode) +
    (avatarColor.hashCode) +
    (email.hashCode) +
    (inTimeline == null ? 0 : inTimeline!.hashCode) +
    (name.hashCode) +
    (profileChangedAt.hashCode) +
    (profileImagePath.hashCode) +
    (birthDate == null ? 0 : birthDate!.hashCode) +
    (isHidden.hashCode) +
    (thumbnailPath.hashCode) +
    (album == null ? 0 : album!.hashCode) +
    (allowDownload.hashCode) +
    (allowUpload.hashCode) +
    (expiresAt == null ? 0 : expiresAt!.hashCode) +
    (key.hashCode) +
    (password == null ? 0 : password!.hashCode) +
    (showMetadata.hashCode) +
    (token == null ? 0 : token!.hashCode) +
    (userId.hashCode) +
    (primaryAssetId.hashCode);

  @override
  String toString() => 'SyncStreamResponseDtoData[checksum=$checksum, deviceAssetId=$deviceAssetId, deviceId=$deviceId, duplicateId=$duplicateId, duration=$duration, exifInfo=$exifInfo, fileCreatedAt=$fileCreatedAt, fileModifiedAt=$fileModifiedAt, hasMetadata=$hasMetadata, id=$id, isArchived=$isArchived, isFavorite=$isFavorite, isOffline=$isOffline, isTrashed=$isTrashed, libraryId=$libraryId, livePhotoVideoId=$livePhotoVideoId, localDateTime=$localDateTime, originalFileName=$originalFileName, originalMimeType=$originalMimeType, originalPath=$originalPath, owner=$owner, ownerId=$ownerId, people=$people, resized=$resized, smartInfo=$smartInfo, stack=$stack, tags=$tags, thumbhash=$thumbhash, type=$type, unassignedFaces=$unassignedFaces, updatedAt=$updatedAt, albumName=$albumName, albumThumbnailAssetId=$albumThumbnailAssetId, albumUsers=$albumUsers, assetCount=$assetCount, assets=$assets, createdAt=$createdAt, description=$description, endDate=$endDate, hasSharedLink=$hasSharedLink, isActivityEnabled=$isActivityEnabled, lastModifiedAssetTimestamp=$lastModifiedAssetTimestamp, order=$order, shared=$shared, startDate=$startDate, albumId=$albumId, assetId=$assetId, comment=$comment, user=$user, data=$data, deletedAt=$deletedAt, isSaved=$isSaved, memoryAt=$memoryAt, seenAt=$seenAt, avatarColor=$avatarColor, email=$email, inTimeline=$inTimeline, name=$name, profileChangedAt=$profileChangedAt, profileImagePath=$profileImagePath, birthDate=$birthDate, isHidden=$isHidden, thumbnailPath=$thumbnailPath, album=$album, allowDownload=$allowDownload, allowUpload=$allowUpload, expiresAt=$expiresAt, key=$key, password=$password, showMetadata=$showMetadata, token=$token, userId=$userId, primaryAssetId=$primaryAssetId]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'checksum'] = this.checksum;
      json[r'deviceAssetId'] = this.deviceAssetId;
      json[r'deviceId'] = this.deviceId;
    if (this.duplicateId != null) {
      json[r'duplicateId'] = this.duplicateId;
    } else {
    //  json[r'duplicateId'] = null;
    }
      json[r'duration'] = this.duration;
    if (this.exifInfo != null) {
      json[r'exifInfo'] = this.exifInfo;
    } else {
    //  json[r'exifInfo'] = null;
    }
      json[r'fileCreatedAt'] = this.fileCreatedAt.toUtc().toIso8601String();
      json[r'fileModifiedAt'] = this.fileModifiedAt.toUtc().toIso8601String();
      json[r'hasMetadata'] = this.hasMetadata;
      json[r'id'] = this.id;
      json[r'isArchived'] = this.isArchived;
      json[r'isFavorite'] = this.isFavorite;
      json[r'isOffline'] = this.isOffline;
      json[r'isTrashed'] = this.isTrashed;
    if (this.libraryId != null) {
      json[r'libraryId'] = this.libraryId;
    } else {
    //  json[r'libraryId'] = null;
    }
    if (this.livePhotoVideoId != null) {
      json[r'livePhotoVideoId'] = this.livePhotoVideoId;
    } else {
    //  json[r'livePhotoVideoId'] = null;
    }
      json[r'localDateTime'] = this.localDateTime.toUtc().toIso8601String();
      json[r'originalFileName'] = this.originalFileName;
    if (this.originalMimeType != null) {
      json[r'originalMimeType'] = this.originalMimeType;
    } else {
    //  json[r'originalMimeType'] = null;
    }
      json[r'originalPath'] = this.originalPath;
      json[r'owner'] = this.owner;
      json[r'ownerId'] = this.ownerId;
      json[r'people'] = this.people;
    if (this.resized != null) {
      json[r'resized'] = this.resized;
    } else {
    //  json[r'resized'] = null;
    }
    if (this.smartInfo != null) {
      json[r'smartInfo'] = this.smartInfo;
    } else {
    //  json[r'smartInfo'] = null;
    }
    if (this.stack != null) {
      json[r'stack'] = this.stack;
    } else {
    //  json[r'stack'] = null;
    }
      json[r'tags'] = this.tags;
    if (this.thumbhash != null) {
      json[r'thumbhash'] = this.thumbhash;
    } else {
    //  json[r'thumbhash'] = null;
    }
      json[r'type'] = this.type;
      json[r'unassignedFaces'] = this.unassignedFaces;
      json[r'updatedAt'] = this.updatedAt.toUtc().toIso8601String();
      json[r'albumName'] = this.albumName;
    if (this.albumThumbnailAssetId != null) {
      json[r'albumThumbnailAssetId'] = this.albumThumbnailAssetId;
    } else {
    //  json[r'albumThumbnailAssetId'] = null;
    }
      json[r'albumUsers'] = this.albumUsers;
      json[r'assetCount'] = this.assetCount;
      json[r'assets'] = this.assets;
      json[r'createdAt'] = this.createdAt.toUtc().toIso8601String();
    if (this.description != null) {
      json[r'description'] = this.description;
    } else {
    //  json[r'description'] = null;
    }
    if (this.endDate != null) {
      json[r'endDate'] = this.endDate!.toUtc().toIso8601String();
    } else {
    //  json[r'endDate'] = null;
    }
      json[r'hasSharedLink'] = this.hasSharedLink;
      json[r'isActivityEnabled'] = this.isActivityEnabled;
    if (this.lastModifiedAssetTimestamp != null) {
      json[r'lastModifiedAssetTimestamp'] = this.lastModifiedAssetTimestamp!.toUtc().toIso8601String();
    } else {
    //  json[r'lastModifiedAssetTimestamp'] = null;
    }
    if (this.order != null) {
      json[r'order'] = this.order;
    } else {
    //  json[r'order'] = null;
    }
      json[r'shared'] = this.shared;
    if (this.startDate != null) {
      json[r'startDate'] = this.startDate!.toUtc().toIso8601String();
    } else {
    //  json[r'startDate'] = null;
    }
      json[r'albumId'] = this.albumId;
    if (this.assetId != null) {
      json[r'assetId'] = this.assetId;
    } else {
    //  json[r'assetId'] = null;
    }
    if (this.comment != null) {
      json[r'comment'] = this.comment;
    } else {
    //  json[r'comment'] = null;
    }
      json[r'user'] = this.user;
      json[r'data'] = this.data;
    if (this.deletedAt != null) {
      json[r'deletedAt'] = this.deletedAt!.toUtc().toIso8601String();
    } else {
    //  json[r'deletedAt'] = null;
    }
      json[r'isSaved'] = this.isSaved;
      json[r'memoryAt'] = this.memoryAt.toUtc().toIso8601String();
    if (this.seenAt != null) {
      json[r'seenAt'] = this.seenAt!.toUtc().toIso8601String();
    } else {
    //  json[r'seenAt'] = null;
    }
      json[r'avatarColor'] = this.avatarColor;
      json[r'email'] = this.email;
    if (this.inTimeline != null) {
      json[r'inTimeline'] = this.inTimeline;
    } else {
    //  json[r'inTimeline'] = null;
    }
      json[r'name'] = this.name;
      json[r'profileChangedAt'] = this.profileChangedAt.toUtc().toIso8601String();
      json[r'profileImagePath'] = this.profileImagePath;
    if (this.birthDate != null) {
      json[r'birthDate'] = _dateFormatter.format(this.birthDate!.toUtc());
    } else {
    //  json[r'birthDate'] = null;
    }
      json[r'isHidden'] = this.isHidden;
      json[r'thumbnailPath'] = this.thumbnailPath;
    if (this.album != null) {
      json[r'album'] = this.album;
    } else {
    //  json[r'album'] = null;
    }
      json[r'allowDownload'] = this.allowDownload;
      json[r'allowUpload'] = this.allowUpload;
    if (this.expiresAt != null) {
      json[r'expiresAt'] = this.expiresAt!.toUtc().toIso8601String();
    } else {
    //  json[r'expiresAt'] = null;
    }
      json[r'key'] = this.key;
    if (this.password != null) {
      json[r'password'] = this.password;
    } else {
    //  json[r'password'] = null;
    }
      json[r'showMetadata'] = this.showMetadata;
    if (this.token != null) {
      json[r'token'] = this.token;
    } else {
    //  json[r'token'] = null;
    }
      json[r'userId'] = this.userId;
      json[r'primaryAssetId'] = this.primaryAssetId;
    return json;
  }

  /// Returns a new [SyncStreamResponseDtoData] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static SyncStreamResponseDtoData? fromJson(dynamic value) {
    upgradeDto(value, "SyncStreamResponseDtoData");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return SyncStreamResponseDtoData(
        checksum: mapValueOfType<String>(json, r'checksum')!,
        deviceAssetId: mapValueOfType<String>(json, r'deviceAssetId')!,
        deviceId: mapValueOfType<String>(json, r'deviceId')!,
        duplicateId: mapValueOfType<String>(json, r'duplicateId'),
        duration: mapValueOfType<String>(json, r'duration')!,
        exifInfo: ExifResponseDto.fromJson(json[r'exifInfo']),
        fileCreatedAt: mapDateTime(json, r'fileCreatedAt', r'')!,
        fileModifiedAt: mapDateTime(json, r'fileModifiedAt', r'')!,
        hasMetadata: mapValueOfType<bool>(json, r'hasMetadata')!,
        id: mapValueOfType<String>(json, r'id')!,
        isArchived: mapValueOfType<bool>(json, r'isArchived')!,
        isFavorite: mapValueOfType<bool>(json, r'isFavorite')!,
        isOffline: mapValueOfType<bool>(json, r'isOffline')!,
        isTrashed: mapValueOfType<bool>(json, r'isTrashed')!,
        libraryId: mapValueOfType<String>(json, r'libraryId'),
        livePhotoVideoId: mapValueOfType<String>(json, r'livePhotoVideoId'),
        localDateTime: mapDateTime(json, r'localDateTime', r'')!,
        originalFileName: mapValueOfType<String>(json, r'originalFileName')!,
        originalMimeType: mapValueOfType<String>(json, r'originalMimeType'),
        originalPath: mapValueOfType<String>(json, r'originalPath')!,
        owner: UserResponseDto.fromJson(json[r'owner'])!,
        ownerId: mapValueOfType<String>(json, r'ownerId')!,
        people: PersonWithFacesResponseDto.listFromJson(json[r'people']),
        resized: mapValueOfType<bool>(json, r'resized'),
        smartInfo: SmartInfoResponseDto.fromJson(json[r'smartInfo']),
        stack: AssetStackResponseDto.fromJson(json[r'stack']),
        tags: TagResponseDto.listFromJson(json[r'tags']),
        thumbhash: mapValueOfType<String>(json, r'thumbhash'),
        type: SharedLinkType.fromJson(json[r'type'])!,
        unassignedFaces: AssetFaceWithoutPersonResponseDto.listFromJson(json[r'unassignedFaces']),
        updatedAt: mapDateTime(json, r'updatedAt', r'')!,
        albumName: mapValueOfType<String>(json, r'albumName')!,
        albumThumbnailAssetId: mapValueOfType<String>(json, r'albumThumbnailAssetId'),
        albumUsers: AlbumUserResponseDto.listFromJson(json[r'albumUsers']),
        assetCount: mapValueOfType<int>(json, r'assetCount')!,
        assets: AssetResponseDto.listFromJson(json[r'assets']),
        createdAt: mapDateTime(json, r'createdAt', r'')!,
        description: mapValueOfType<String>(json, r'description'),
        endDate: mapDateTime(json, r'endDate', r''),
        hasSharedLink: mapValueOfType<bool>(json, r'hasSharedLink')!,
        isActivityEnabled: mapValueOfType<bool>(json, r'isActivityEnabled')!,
        lastModifiedAssetTimestamp: mapDateTime(json, r'lastModifiedAssetTimestamp', r''),
        order: AssetOrder.fromJson(json[r'order']),
        shared: mapValueOfType<bool>(json, r'shared')!,
        startDate: mapDateTime(json, r'startDate', r''),
        albumId: mapValueOfType<String>(json, r'albumId')!,
        assetId: mapValueOfType<String>(json, r'assetId'),
        comment: mapValueOfType<String>(json, r'comment'),
        user: UserResponseDto.fromJson(json[r'user'])!,
        data: OnThisDayDto.fromJson(json[r'data'])!,
        deletedAt: mapDateTime(json, r'deletedAt', r''),
        isSaved: mapValueOfType<bool>(json, r'isSaved')!,
        memoryAt: mapDateTime(json, r'memoryAt', r'')!,
        seenAt: mapDateTime(json, r'seenAt', r''),
        avatarColor: UserAvatarColor.fromJson(json[r'avatarColor'])!,
        email: mapValueOfType<String>(json, r'email')!,
        inTimeline: mapValueOfType<bool>(json, r'inTimeline'),
        name: mapValueOfType<String>(json, r'name')!,
        profileChangedAt: mapDateTime(json, r'profileChangedAt', r'')!,
        profileImagePath: mapValueOfType<String>(json, r'profileImagePath')!,
        birthDate: mapDateTime(json, r'birthDate', r''),
        isHidden: mapValueOfType<bool>(json, r'isHidden')!,
        thumbnailPath: mapValueOfType<String>(json, r'thumbnailPath')!,
        album: AlbumResponseDto.fromJson(json[r'album']),
        allowDownload: mapValueOfType<bool>(json, r'allowDownload')!,
        allowUpload: mapValueOfType<bool>(json, r'allowUpload')!,
        expiresAt: mapDateTime(json, r'expiresAt', r''),
        key: mapValueOfType<String>(json, r'key')!,
        password: mapValueOfType<String>(json, r'password'),
        showMetadata: mapValueOfType<bool>(json, r'showMetadata')!,
        token: mapValueOfType<String>(json, r'token'),
        userId: mapValueOfType<String>(json, r'userId')!,
        primaryAssetId: mapValueOfType<String>(json, r'primaryAssetId')!,
      );
    }
    return null;
  }

  static List<SyncStreamResponseDtoData> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <SyncStreamResponseDtoData>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = SyncStreamResponseDtoData.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, SyncStreamResponseDtoData> mapFromJson(dynamic json) {
    final map = <String, SyncStreamResponseDtoData>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = SyncStreamResponseDtoData.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of SyncStreamResponseDtoData-objects as value to a dart map
  static Map<String, List<SyncStreamResponseDtoData>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<SyncStreamResponseDtoData>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = SyncStreamResponseDtoData.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'checksum',
    'deviceAssetId',
    'deviceId',
    'duration',
    'fileCreatedAt',
    'fileModifiedAt',
    'hasMetadata',
    'id',
    'isArchived',
    'isFavorite',
    'isOffline',
    'isTrashed',
    'localDateTime',
    'originalFileName',
    'originalPath',
    'owner',
    'ownerId',
    'thumbhash',
    'type',
    'updatedAt',
    'albumName',
    'albumThumbnailAssetId',
    'albumUsers',
    'assetCount',
    'assets',
    'createdAt',
    'description',
    'hasSharedLink',
    'isActivityEnabled',
    'shared',
    'albumId',
    'assetId',
    'user',
    'data',
    'isSaved',
    'memoryAt',
    'avatarColor',
    'email',
    'name',
    'profileChangedAt',
    'profileImagePath',
    'birthDate',
    'isHidden',
    'thumbnailPath',
    'allowDownload',
    'allowUpload',
    'expiresAt',
    'key',
    'password',
    'showMetadata',
    'userId',
    'primaryAssetId',
  };
}

