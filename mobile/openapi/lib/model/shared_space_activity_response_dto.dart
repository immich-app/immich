//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class SharedSpaceActivityResponseDto {
  /// Returns a new [SharedSpaceActivityResponseDto] instance.
  SharedSpaceActivityResponseDto({
    required this.createdAt,
    required this.data,
    required this.id,
    required this.type,
    this.userAvatarColor,
    this.userEmail,
    this.userId,
    this.userName,
    this.userProfileImagePath,
  });

  /// When the event occurred
  String createdAt;

  /// Event-specific data
  Object data;

  /// Activity ID
  String id;

  /// Activity type
  String type;

  /// User avatar color
  String? userAvatarColor;

  /// User email
  String? userEmail;

  /// User ID who performed the action
  String? userId;

  /// User name
  String? userName;

  /// User profile image path
  String? userProfileImagePath;

  @override
  bool operator ==(Object other) => identical(this, other) || other is SharedSpaceActivityResponseDto &&
    other.createdAt == createdAt &&
    other.data == data &&
    other.id == id &&
    other.type == type &&
    other.userAvatarColor == userAvatarColor &&
    other.userEmail == userEmail &&
    other.userId == userId &&
    other.userName == userName &&
    other.userProfileImagePath == userProfileImagePath;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (createdAt.hashCode) +
    (data.hashCode) +
    (id.hashCode) +
    (type.hashCode) +
    (userAvatarColor == null ? 0 : userAvatarColor!.hashCode) +
    (userEmail == null ? 0 : userEmail!.hashCode) +
    (userId == null ? 0 : userId!.hashCode) +
    (userName == null ? 0 : userName!.hashCode) +
    (userProfileImagePath == null ? 0 : userProfileImagePath!.hashCode);

  @override
  String toString() => 'SharedSpaceActivityResponseDto[createdAt=$createdAt, data=$data, id=$id, type=$type, userAvatarColor=$userAvatarColor, userEmail=$userEmail, userId=$userId, userName=$userName, userProfileImagePath=$userProfileImagePath]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'createdAt'] = this.createdAt;
      json[r'data'] = this.data;
      json[r'id'] = this.id;
      json[r'type'] = this.type;
    if (this.userAvatarColor != null) {
      json[r'userAvatarColor'] = this.userAvatarColor;
    } else {
    //  json[r'userAvatarColor'] = null;
    }
    if (this.userEmail != null) {
      json[r'userEmail'] = this.userEmail;
    } else {
    //  json[r'userEmail'] = null;
    }
    if (this.userId != null) {
      json[r'userId'] = this.userId;
    } else {
    //  json[r'userId'] = null;
    }
    if (this.userName != null) {
      json[r'userName'] = this.userName;
    } else {
    //  json[r'userName'] = null;
    }
    if (this.userProfileImagePath != null) {
      json[r'userProfileImagePath'] = this.userProfileImagePath;
    } else {
    //  json[r'userProfileImagePath'] = null;
    }
    return json;
  }

  /// Returns a new [SharedSpaceActivityResponseDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static SharedSpaceActivityResponseDto? fromJson(dynamic value) {
    upgradeDto(value, "SharedSpaceActivityResponseDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return SharedSpaceActivityResponseDto(
        createdAt: mapValueOfType<String>(json, r'createdAt')!,
        data: mapValueOfType<Object>(json, r'data')!,
        id: mapValueOfType<String>(json, r'id')!,
        type: mapValueOfType<String>(json, r'type')!,
        userAvatarColor: mapValueOfType<String>(json, r'userAvatarColor'),
        userEmail: mapValueOfType<String>(json, r'userEmail'),
        userId: mapValueOfType<String>(json, r'userId'),
        userName: mapValueOfType<String>(json, r'userName'),
        userProfileImagePath: mapValueOfType<String>(json, r'userProfileImagePath'),
      );
    }
    return null;
  }

  static List<SharedSpaceActivityResponseDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <SharedSpaceActivityResponseDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = SharedSpaceActivityResponseDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, SharedSpaceActivityResponseDto> mapFromJson(dynamic json) {
    final map = <String, SharedSpaceActivityResponseDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = SharedSpaceActivityResponseDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of SharedSpaceActivityResponseDto-objects as value to a dart map
  static Map<String, List<SharedSpaceActivityResponseDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<SharedSpaceActivityResponseDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = SharedSpaceActivityResponseDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'createdAt',
    'data',
    'id',
    'type',
  };
}

