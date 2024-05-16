//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class ActivityResponseDto {
  /// Returns a new [ActivityResponseDto] instance.
  ActivityResponseDto({
    required this.assetId,
    this.comment,
    required this.createdAt,
    required this.id,
    required this.type,
    required this.user,
  });

  String? assetId;

  String? comment;

  DateTime createdAt;

  String id;

  ActivityResponseDtoTypeEnum type;

  UserDto user;

  @override
  bool operator ==(Object other) => identical(this, other) || other is ActivityResponseDto &&
    other.assetId == assetId &&
    other.comment == comment &&
    other.createdAt == createdAt &&
    other.id == id &&
    other.type == type &&
    other.user == user;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (assetId == null ? 0 : assetId!.hashCode) +
    (comment == null ? 0 : comment!.hashCode) +
    (createdAt.hashCode) +
    (id.hashCode) +
    (type.hashCode) +
    (user.hashCode);

  @override
  String toString() => 'ActivityResponseDto[assetId=$assetId, comment=$comment, createdAt=$createdAt, id=$id, type=$type, user=$user]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
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
      json[r'createdAt'] = this.createdAt.toUtc().toIso8601String();
      json[r'id'] = this.id;
      json[r'type'] = this.type;
      json[r'user'] = this.user;
    return json;
  }

  /// Returns a new [ActivityResponseDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static ActivityResponseDto? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return ActivityResponseDto(
        assetId: mapValueOfType<String>(json, r'assetId'),
        comment: mapValueOfType<String>(json, r'comment'),
        createdAt: mapDateTime(json, r'createdAt', r'')!,
        id: mapValueOfType<String>(json, r'id')!,
        type: ActivityResponseDtoTypeEnum.fromJson(json[r'type'])!,
        user: UserDto.fromJson(json[r'user'])!,
      );
    }
    return null;
  }

  static List<ActivityResponseDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <ActivityResponseDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = ActivityResponseDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, ActivityResponseDto> mapFromJson(dynamic json) {
    final map = <String, ActivityResponseDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = ActivityResponseDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of ActivityResponseDto-objects as value to a dart map
  static Map<String, List<ActivityResponseDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<ActivityResponseDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = ActivityResponseDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'assetId',
    'createdAt',
    'id',
    'type',
    'user',
  };
}


class ActivityResponseDtoTypeEnum {
  /// Instantiate a new enum with the provided [value].
  const ActivityResponseDtoTypeEnum._(this.value);

  /// The underlying value of this enum member.
  final String value;

  @override
  String toString() => value;

  String toJson() => value;

  static const comment = ActivityResponseDtoTypeEnum._(r'comment');
  static const like = ActivityResponseDtoTypeEnum._(r'like');

  /// List of all possible values in this [enum][ActivityResponseDtoTypeEnum].
  static const values = <ActivityResponseDtoTypeEnum>[
    comment,
    like,
  ];

  static ActivityResponseDtoTypeEnum? fromJson(dynamic value) => ActivityResponseDtoTypeEnumTypeTransformer().decode(value);

  static List<ActivityResponseDtoTypeEnum> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <ActivityResponseDtoTypeEnum>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = ActivityResponseDtoTypeEnum.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }
}

/// Transformation class that can [encode] an instance of [ActivityResponseDtoTypeEnum] to String,
/// and [decode] dynamic data back to [ActivityResponseDtoTypeEnum].
class ActivityResponseDtoTypeEnumTypeTransformer {
  factory ActivityResponseDtoTypeEnumTypeTransformer() => _instance ??= const ActivityResponseDtoTypeEnumTypeTransformer._();

  const ActivityResponseDtoTypeEnumTypeTransformer._();

  String encode(ActivityResponseDtoTypeEnum data) => data.value;

  /// Decodes a [dynamic value][data] to a ActivityResponseDtoTypeEnum.
  ///
  /// If [allowNull] is true and the [dynamic value][data] cannot be decoded successfully,
  /// then null is returned. However, if [allowNull] is false and the [dynamic value][data]
  /// cannot be decoded successfully, then an [UnimplementedError] is thrown.
  ///
  /// The [allowNull] is very handy when an API changes and a new enum value is added or removed,
  /// and users are still using an old app with the old code.
  ActivityResponseDtoTypeEnum? decode(dynamic data, {bool allowNull = true}) {
    if (data != null) {
      switch (data) {
        case r'comment': return ActivityResponseDtoTypeEnum.comment;
        case r'like': return ActivityResponseDtoTypeEnum.like;
        default:
          if (!allowNull) {
            throw ArgumentError('Unknown enum value to decode: $data');
          }
      }
    }
    return null;
  }

  /// Singleton [ActivityResponseDtoTypeEnumTypeTransformer] instance.
  static ActivityResponseDtoTypeEnumTypeTransformer? _instance;
}


