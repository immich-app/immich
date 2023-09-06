//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.12

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class AssetResponseDto {
  /// Returns a new [AssetResponseDto] instance.
  AssetResponseDto({
    required this.checksum,
    required this.deviceAssetId,
    required this.deviceId,
    required this.duration,
    this.exifInfo,
    required this.fileCreatedAt,
    required this.fileModifiedAt,
    required this.id,
    required this.isArchived,
    required this.isFavorite,
    this.livePhotoVideoId,
    required this.originalFileName,
    required this.originalPath,
    this.owner,
    required this.ownerId,
    this.people = const [],
    required this.resized,
    this.smartInfo,
    this.tags = const [],
    required this.thumbhash,
    required this.type,
    required this.updatedAt,
  });

  /// base64 encoded sha1 hash
  String checksum;

  String deviceAssetId;

  String deviceId;

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

  String id;

  bool isArchived;

  bool isFavorite;

  String? livePhotoVideoId;

  String originalFileName;

  String originalPath;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  UserResponseDto? owner;

  String ownerId;

  List<PersonResponseDto> people;

  bool resized;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  SmartInfoResponseDto? smartInfo;

  List<TagResponseDto> tags;

  /// base64 encoded thumbhash
  String? thumbhash;

  AssetTypeEnum type;

  DateTime updatedAt;

  @override
  bool operator ==(Object other) => identical(this, other) || other is AssetResponseDto &&
     other.checksum == checksum &&
     other.deviceAssetId == deviceAssetId &&
     other.deviceId == deviceId &&
     other.duration == duration &&
     other.exifInfo == exifInfo &&
     other.fileCreatedAt == fileCreatedAt &&
     other.fileModifiedAt == fileModifiedAt &&
     other.id == id &&
     other.isArchived == isArchived &&
     other.isFavorite == isFavorite &&
     other.livePhotoVideoId == livePhotoVideoId &&
     other.originalFileName == originalFileName &&
     other.originalPath == originalPath &&
     other.owner == owner &&
     other.ownerId == ownerId &&
     other.people == people &&
     other.resized == resized &&
     other.smartInfo == smartInfo &&
     other.tags == tags &&
     other.thumbhash == thumbhash &&
     other.type == type &&
     other.updatedAt == updatedAt;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (checksum.hashCode) +
    (deviceAssetId.hashCode) +
    (deviceId.hashCode) +
    (duration.hashCode) +
    (exifInfo == null ? 0 : exifInfo!.hashCode) +
    (fileCreatedAt.hashCode) +
    (fileModifiedAt.hashCode) +
    (id.hashCode) +
    (isArchived.hashCode) +
    (isFavorite.hashCode) +
    (livePhotoVideoId == null ? 0 : livePhotoVideoId!.hashCode) +
    (originalFileName.hashCode) +
    (originalPath.hashCode) +
    (owner == null ? 0 : owner!.hashCode) +
    (ownerId.hashCode) +
    (people.hashCode) +
    (resized.hashCode) +
    (smartInfo == null ? 0 : smartInfo!.hashCode) +
    (tags.hashCode) +
    (thumbhash == null ? 0 : thumbhash!.hashCode) +
    (type.hashCode) +
    (updatedAt.hashCode);

  @override
  String toString() => 'AssetResponseDto[checksum=$checksum, deviceAssetId=$deviceAssetId, deviceId=$deviceId, duration=$duration, exifInfo=$exifInfo, fileCreatedAt=$fileCreatedAt, fileModifiedAt=$fileModifiedAt, id=$id, isArchived=$isArchived, isFavorite=$isFavorite, livePhotoVideoId=$livePhotoVideoId, originalFileName=$originalFileName, originalPath=$originalPath, owner=$owner, ownerId=$ownerId, people=$people, resized=$resized, smartInfo=$smartInfo, tags=$tags, thumbhash=$thumbhash, type=$type, updatedAt=$updatedAt]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'checksum'] = this.checksum;
      json[r'deviceAssetId'] = this.deviceAssetId;
      json[r'deviceId'] = this.deviceId;
      json[r'duration'] = this.duration;
    if (this.exifInfo != null) {
      json[r'exifInfo'] = this.exifInfo;
    } else {
    //  json[r'exifInfo'] = null;
    }
      json[r'fileCreatedAt'] = this.fileCreatedAt.toUtc().toIso8601String();
      json[r'fileModifiedAt'] = this.fileModifiedAt.toUtc().toIso8601String();
      json[r'id'] = this.id;
      json[r'isArchived'] = this.isArchived;
      json[r'isFavorite'] = this.isFavorite;
    if (this.livePhotoVideoId != null) {
      json[r'livePhotoVideoId'] = this.livePhotoVideoId;
    } else {
    //  json[r'livePhotoVideoId'] = null;
    }
      json[r'originalFileName'] = this.originalFileName;
      json[r'originalPath'] = this.originalPath;
    if (this.owner != null) {
      json[r'owner'] = this.owner;
    } else {
    //  json[r'owner'] = null;
    }
      json[r'ownerId'] = this.ownerId;
      json[r'people'] = this.people;
      json[r'resized'] = this.resized;
    if (this.smartInfo != null) {
      json[r'smartInfo'] = this.smartInfo;
    } else {
    //  json[r'smartInfo'] = null;
    }
      json[r'tags'] = this.tags;
    if (this.thumbhash != null) {
      json[r'thumbhash'] = this.thumbhash;
    } else {
    //  json[r'thumbhash'] = null;
    }
      json[r'type'] = this.type;
      json[r'updatedAt'] = this.updatedAt.toUtc().toIso8601String();
    return json;
  }

  /// Returns a new [AssetResponseDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static AssetResponseDto? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return AssetResponseDto(
        checksum: mapValueOfType<String>(json, r'checksum')!,
        deviceAssetId: mapValueOfType<String>(json, r'deviceAssetId')!,
        deviceId: mapValueOfType<String>(json, r'deviceId')!,
        duration: mapValueOfType<String>(json, r'duration')!,
        exifInfo: ExifResponseDto.fromJson(json[r'exifInfo']),
        fileCreatedAt: mapDateTime(json, r'fileCreatedAt', '')!,
        fileModifiedAt: mapDateTime(json, r'fileModifiedAt', '')!,
        id: mapValueOfType<String>(json, r'id')!,
        isArchived: mapValueOfType<bool>(json, r'isArchived')!,
        isFavorite: mapValueOfType<bool>(json, r'isFavorite')!,
        livePhotoVideoId: mapValueOfType<String>(json, r'livePhotoVideoId'),
        originalFileName: mapValueOfType<String>(json, r'originalFileName')!,
        originalPath: mapValueOfType<String>(json, r'originalPath')!,
        owner: UserResponseDto.fromJson(json[r'owner']),
        ownerId: mapValueOfType<String>(json, r'ownerId')!,
        people: PersonResponseDto.listFromJson(json[r'people']),
        resized: mapValueOfType<bool>(json, r'resized')!,
        smartInfo: SmartInfoResponseDto.fromJson(json[r'smartInfo']),
        tags: TagResponseDto.listFromJson(json[r'tags']),
        thumbhash: mapValueOfType<String>(json, r'thumbhash'),
        type: AssetTypeEnum.fromJson(json[r'type'])!,
        updatedAt: mapDateTime(json, r'updatedAt', '')!,
      );
    }
    return null;
  }

  static List<AssetResponseDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <AssetResponseDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = AssetResponseDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, AssetResponseDto> mapFromJson(dynamic json) {
    final map = <String, AssetResponseDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = AssetResponseDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of AssetResponseDto-objects as value to a dart map
  static Map<String, List<AssetResponseDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<AssetResponseDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = AssetResponseDto.listFromJson(entry.value, growable: growable,);
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
    'id',
    'isArchived',
    'isFavorite',
    'originalFileName',
    'originalPath',
    'ownerId',
    'resized',
    'thumbhash',
    'type',
    'updatedAt',
  };
}

