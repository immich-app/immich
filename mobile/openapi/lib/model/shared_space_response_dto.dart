//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class SharedSpaceResponseDto {
  /// Returns a new [SharedSpaceResponseDto] instance.
  SharedSpaceResponseDto({
    this.assetCount,
    this.color,
    required this.createdAt,
    required this.createdById,
    this.description,
    this.faceRecognitionEnabled,
    this.hasPets,
    required this.id,
    this.lastActivityAt,
    this.lastContributor,
    this.lastViewedAt,
    this.linkedLibraries = const [],
    this.memberCount,
    this.members = const [],
    required this.name,
    this.newAssetCount,
    this.petsEnabled,
    this.recentAssetIds = const [],
    this.recentAssetThumbhashes = const [],
    this.thumbnailAssetId,
    this.thumbnailCropY,
    required this.updatedAt,
  });

  /// Number of assets
  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  num? assetCount;

  /// Space color
  SharedSpaceResponseDtoColorEnum? color;

  /// Creation date
  String createdAt;

  /// Creator user ID
  String createdById;

  /// Space description
  String? description;

  /// Whether face recognition is enabled for this space
  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  bool? faceRecognitionEnabled;

  /// Whether any pet-type persons exist in this space
  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  bool? hasPets;

  /// Space ID
  String id;

  /// Last activity timestamp (most recent asset add)
  String? lastActivityAt;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  SharedSpaceResponseDtoLastContributor? lastContributor;

  /// When the current user last viewed this space
  String? lastViewedAt;

  List<SharedSpaceLinkedLibraryDto> linkedLibraries;

  /// Number of members
  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  num? memberCount;

  /// Space members (summary)
  List<SharedSpaceMemberResponseDto> members;

  /// Space name
  String name;

  /// Number of new assets since last viewed
  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  num? newAssetCount;

  /// Whether pets are shown in space people list
  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  bool? petsEnabled;

  /// Recent asset IDs for collage display (up to 4)
  List<String> recentAssetIds;

  /// Thumbhashes for recent assets (parallel array)
  List<String> recentAssetThumbhashes;

  /// Thumbnail asset ID
  String? thumbnailAssetId;

  /// Vertical crop position for cover photo (0-100)
  num? thumbnailCropY;

  /// Last update date
  String updatedAt;

  @override
  bool operator ==(Object other) => identical(this, other) || other is SharedSpaceResponseDto &&
    other.assetCount == assetCount &&
    other.color == color &&
    other.createdAt == createdAt &&
    other.createdById == createdById &&
    other.description == description &&
    other.faceRecognitionEnabled == faceRecognitionEnabled &&
    other.hasPets == hasPets &&
    other.id == id &&
    other.lastActivityAt == lastActivityAt &&
    other.lastContributor == lastContributor &&
    other.lastViewedAt == lastViewedAt &&
    _deepEquality.equals(other.linkedLibraries, linkedLibraries) &&
    other.memberCount == memberCount &&
    _deepEquality.equals(other.members, members) &&
    other.name == name &&
    other.newAssetCount == newAssetCount &&
    other.petsEnabled == petsEnabled &&
    _deepEquality.equals(other.recentAssetIds, recentAssetIds) &&
    _deepEquality.equals(other.recentAssetThumbhashes, recentAssetThumbhashes) &&
    other.thumbnailAssetId == thumbnailAssetId &&
    other.thumbnailCropY == thumbnailCropY &&
    other.updatedAt == updatedAt;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (assetCount == null ? 0 : assetCount!.hashCode) +
    (color == null ? 0 : color!.hashCode) +
    (createdAt.hashCode) +
    (createdById.hashCode) +
    (description == null ? 0 : description!.hashCode) +
    (faceRecognitionEnabled == null ? 0 : faceRecognitionEnabled!.hashCode) +
    (hasPets == null ? 0 : hasPets!.hashCode) +
    (id.hashCode) +
    (lastActivityAt == null ? 0 : lastActivityAt!.hashCode) +
    (lastContributor == null ? 0 : lastContributor!.hashCode) +
    (lastViewedAt == null ? 0 : lastViewedAt!.hashCode) +
    (linkedLibraries.hashCode) +
    (memberCount == null ? 0 : memberCount!.hashCode) +
    (members.hashCode) +
    (name.hashCode) +
    (newAssetCount == null ? 0 : newAssetCount!.hashCode) +
    (petsEnabled == null ? 0 : petsEnabled!.hashCode) +
    (recentAssetIds.hashCode) +
    (recentAssetThumbhashes.hashCode) +
    (thumbnailAssetId == null ? 0 : thumbnailAssetId!.hashCode) +
    (thumbnailCropY == null ? 0 : thumbnailCropY!.hashCode) +
    (updatedAt.hashCode);

  @override
  String toString() => 'SharedSpaceResponseDto[assetCount=$assetCount, color=$color, createdAt=$createdAt, createdById=$createdById, description=$description, faceRecognitionEnabled=$faceRecognitionEnabled, hasPets=$hasPets, id=$id, lastActivityAt=$lastActivityAt, lastContributor=$lastContributor, lastViewedAt=$lastViewedAt, linkedLibraries=$linkedLibraries, memberCount=$memberCount, members=$members, name=$name, newAssetCount=$newAssetCount, petsEnabled=$petsEnabled, recentAssetIds=$recentAssetIds, recentAssetThumbhashes=$recentAssetThumbhashes, thumbnailAssetId=$thumbnailAssetId, thumbnailCropY=$thumbnailCropY, updatedAt=$updatedAt]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    if (this.assetCount != null) {
      json[r'assetCount'] = this.assetCount;
    } else {
    //  json[r'assetCount'] = null;
    }
    if (this.color != null) {
      json[r'color'] = this.color;
    } else {
    //  json[r'color'] = null;
    }
      json[r'createdAt'] = this.createdAt;
      json[r'createdById'] = this.createdById;
    if (this.description != null) {
      json[r'description'] = this.description;
    } else {
    //  json[r'description'] = null;
    }
    if (this.faceRecognitionEnabled != null) {
      json[r'faceRecognitionEnabled'] = this.faceRecognitionEnabled;
    } else {
    //  json[r'faceRecognitionEnabled'] = null;
    }
    if (this.hasPets != null) {
      json[r'hasPets'] = this.hasPets;
    } else {
    //  json[r'hasPets'] = null;
    }
      json[r'id'] = this.id;
    if (this.lastActivityAt != null) {
      json[r'lastActivityAt'] = this.lastActivityAt;
    } else {
    //  json[r'lastActivityAt'] = null;
    }
    if (this.lastContributor != null) {
      json[r'lastContributor'] = this.lastContributor;
    } else {
    //  json[r'lastContributor'] = null;
    }
    if (this.lastViewedAt != null) {
      json[r'lastViewedAt'] = this.lastViewedAt;
    } else {
    //  json[r'lastViewedAt'] = null;
    }
      json[r'linkedLibraries'] = this.linkedLibraries;
    if (this.memberCount != null) {
      json[r'memberCount'] = this.memberCount;
    } else {
    //  json[r'memberCount'] = null;
    }
      json[r'members'] = this.members;
      json[r'name'] = this.name;
    if (this.newAssetCount != null) {
      json[r'newAssetCount'] = this.newAssetCount;
    } else {
    //  json[r'newAssetCount'] = null;
    }
    if (this.petsEnabled != null) {
      json[r'petsEnabled'] = this.petsEnabled;
    } else {
    //  json[r'petsEnabled'] = null;
    }
      json[r'recentAssetIds'] = this.recentAssetIds;
      json[r'recentAssetThumbhashes'] = this.recentAssetThumbhashes;
    if (this.thumbnailAssetId != null) {
      json[r'thumbnailAssetId'] = this.thumbnailAssetId;
    } else {
    //  json[r'thumbnailAssetId'] = null;
    }
    if (this.thumbnailCropY != null) {
      json[r'thumbnailCropY'] = this.thumbnailCropY;
    } else {
    //  json[r'thumbnailCropY'] = null;
    }
      json[r'updatedAt'] = this.updatedAt;
    return json;
  }

  /// Returns a new [SharedSpaceResponseDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static SharedSpaceResponseDto? fromJson(dynamic value) {
    upgradeDto(value, "SharedSpaceResponseDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return SharedSpaceResponseDto(
        assetCount: json[r'assetCount'] == null
            ? null
            : num.parse('${json[r'assetCount']}'),
        color: SharedSpaceResponseDtoColorEnum.fromJson(json[r'color']),
        createdAt: mapValueOfType<String>(json, r'createdAt')!,
        createdById: mapValueOfType<String>(json, r'createdById')!,
        description: mapValueOfType<String>(json, r'description'),
        faceRecognitionEnabled: mapValueOfType<bool>(json, r'faceRecognitionEnabled'),
        hasPets: mapValueOfType<bool>(json, r'hasPets'),
        id: mapValueOfType<String>(json, r'id')!,
        lastActivityAt: mapValueOfType<String>(json, r'lastActivityAt'),
        lastContributor: SharedSpaceResponseDtoLastContributor.fromJson(json[r'lastContributor']),
        lastViewedAt: mapValueOfType<String>(json, r'lastViewedAt'),
        linkedLibraries: SharedSpaceLinkedLibraryDto.listFromJson(json[r'linkedLibraries']),
        memberCount: json[r'memberCount'] == null
            ? null
            : num.parse('${json[r'memberCount']}'),
        members: SharedSpaceMemberResponseDto.listFromJson(json[r'members']),
        name: mapValueOfType<String>(json, r'name')!,
        newAssetCount: json[r'newAssetCount'] == null
            ? null
            : num.parse('${json[r'newAssetCount']}'),
        petsEnabled: mapValueOfType<bool>(json, r'petsEnabled'),
        recentAssetIds: json[r'recentAssetIds'] is Iterable
            ? (json[r'recentAssetIds'] as Iterable).cast<String>().toList(growable: false)
            : const [],
        recentAssetThumbhashes: json[r'recentAssetThumbhashes'] is Iterable
            ? (json[r'recentAssetThumbhashes'] as Iterable).cast<String>().toList(growable: false)
            : const [],
        thumbnailAssetId: mapValueOfType<String>(json, r'thumbnailAssetId'),
        thumbnailCropY: json[r'thumbnailCropY'] == null
            ? null
            : num.parse('${json[r'thumbnailCropY']}'),
        updatedAt: mapValueOfType<String>(json, r'updatedAt')!,
      );
    }
    return null;
  }

  static List<SharedSpaceResponseDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <SharedSpaceResponseDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = SharedSpaceResponseDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, SharedSpaceResponseDto> mapFromJson(dynamic json) {
    final map = <String, SharedSpaceResponseDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = SharedSpaceResponseDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of SharedSpaceResponseDto-objects as value to a dart map
  static Map<String, List<SharedSpaceResponseDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<SharedSpaceResponseDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = SharedSpaceResponseDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'createdAt',
    'createdById',
    'id',
    'name',
    'updatedAt',
  };
}

/// Space color
class SharedSpaceResponseDtoColorEnum {
  /// Instantiate a new enum with the provided [value].
  const SharedSpaceResponseDtoColorEnum._(this.value);

  /// The underlying value of this enum member.
  final String value;

  @override
  String toString() => value;

  String toJson() => value;

  static const primary = SharedSpaceResponseDtoColorEnum._(r'primary');
  static const pink = SharedSpaceResponseDtoColorEnum._(r'pink');
  static const red = SharedSpaceResponseDtoColorEnum._(r'red');
  static const yellow = SharedSpaceResponseDtoColorEnum._(r'yellow');
  static const blue = SharedSpaceResponseDtoColorEnum._(r'blue');
  static const green = SharedSpaceResponseDtoColorEnum._(r'green');
  static const purple = SharedSpaceResponseDtoColorEnum._(r'purple');
  static const orange = SharedSpaceResponseDtoColorEnum._(r'orange');
  static const gray = SharedSpaceResponseDtoColorEnum._(r'gray');
  static const amber = SharedSpaceResponseDtoColorEnum._(r'amber');

  /// List of all possible values in this [enum][SharedSpaceResponseDtoColorEnum].
  static const values = <SharedSpaceResponseDtoColorEnum>[
    primary,
    pink,
    red,
    yellow,
    blue,
    green,
    purple,
    orange,
    gray,
    amber,
  ];

  static SharedSpaceResponseDtoColorEnum? fromJson(dynamic value) => SharedSpaceResponseDtoColorEnumTypeTransformer().decode(value);

  static List<SharedSpaceResponseDtoColorEnum> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <SharedSpaceResponseDtoColorEnum>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = SharedSpaceResponseDtoColorEnum.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }
}

/// Transformation class that can [encode] an instance of [SharedSpaceResponseDtoColorEnum] to String,
/// and [decode] dynamic data back to [SharedSpaceResponseDtoColorEnum].
class SharedSpaceResponseDtoColorEnumTypeTransformer {
  factory SharedSpaceResponseDtoColorEnumTypeTransformer() => _instance ??= const SharedSpaceResponseDtoColorEnumTypeTransformer._();

  const SharedSpaceResponseDtoColorEnumTypeTransformer._();

  String encode(SharedSpaceResponseDtoColorEnum data) => data.value;

  /// Decodes a [dynamic value][data] to a SharedSpaceResponseDtoColorEnum.
  ///
  /// If [allowNull] is true and the [dynamic value][data] cannot be decoded successfully,
  /// then null is returned. However, if [allowNull] is false and the [dynamic value][data]
  /// cannot be decoded successfully, then an [UnimplementedError] is thrown.
  ///
  /// The [allowNull] is very handy when an API changes and a new enum value is added or removed,
  /// and users are still using an old app with the old code.
  SharedSpaceResponseDtoColorEnum? decode(dynamic data, {bool allowNull = true}) {
    if (data != null) {
      switch (data) {
        case r'primary': return SharedSpaceResponseDtoColorEnum.primary;
        case r'pink': return SharedSpaceResponseDtoColorEnum.pink;
        case r'red': return SharedSpaceResponseDtoColorEnum.red;
        case r'yellow': return SharedSpaceResponseDtoColorEnum.yellow;
        case r'blue': return SharedSpaceResponseDtoColorEnum.blue;
        case r'green': return SharedSpaceResponseDtoColorEnum.green;
        case r'purple': return SharedSpaceResponseDtoColorEnum.purple;
        case r'orange': return SharedSpaceResponseDtoColorEnum.orange;
        case r'gray': return SharedSpaceResponseDtoColorEnum.gray;
        case r'amber': return SharedSpaceResponseDtoColorEnum.amber;
        default:
          if (!allowNull) {
            throw ArgumentError('Unknown enum value to decode: $data');
          }
      }
    }
    return null;
  }

  /// Singleton [SharedSpaceResponseDtoColorEnumTypeTransformer] instance.
  static SharedSpaceResponseDtoColorEnumTypeTransformer? _instance;
}


