//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.12

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class ActivityReponseDto {
  /// Returns a new [ActivityReponseDto] instance.
  ActivityReponseDto({
    this.comment,
    required this.createdAt,
    required this.id,
    required this.type,
    required this.user,
  });

  String? comment;

  DateTime createdAt;

  String id;

  ActivityReponseDtoTypeEnum type;

  UserDto user;

  @override
  bool operator ==(Object other) => identical(this, other) || other is ActivityReponseDto &&
     other.comment == comment &&
     other.createdAt == createdAt &&
     other.id == id &&
     other.type == type &&
     other.user == user;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (comment == null ? 0 : comment!.hashCode) +
    (createdAt.hashCode) +
    (id.hashCode) +
    (type.hashCode) +
    (user.hashCode);

  @override
  String toString() => 'ActivityReponseDto[comment=$comment, createdAt=$createdAt, id=$id, type=$type, user=$user]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
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

  /// Returns a new [ActivityReponseDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static ActivityReponseDto? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return ActivityReponseDto(
        comment: mapValueOfType<String>(json, r'comment'),
        createdAt: mapDateTime(json, r'createdAt', '')!,
        id: mapValueOfType<String>(json, r'id')!,
        type: ActivityReponseDtoTypeEnum.fromJson(json[r'type'])!,
        user: UserDto.fromJson(json[r'user'])!,
      );
    }
    return null;
  }

  static List<ActivityReponseDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <ActivityReponseDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = ActivityReponseDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, ActivityReponseDto> mapFromJson(dynamic json) {
    final map = <String, ActivityReponseDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = ActivityReponseDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of ActivityReponseDto-objects as value to a dart map
  static Map<String, List<ActivityReponseDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<ActivityReponseDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = ActivityReponseDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'createdAt',
    'id',
    'type',
    'user',
  };
}


class ActivityReponseDtoTypeEnum {
  /// Instantiate a new enum with the provided [value].
  const ActivityReponseDtoTypeEnum._(this.value);

  /// The underlying value of this enum member.
  final String value;

  @override
  String toString() => value;

  String toJson() => value;

  static const comment = ActivityReponseDtoTypeEnum._(r'comment');
  static const like = ActivityReponseDtoTypeEnum._(r'like');

  /// List of all possible values in this [enum][ActivityReponseDtoTypeEnum].
  static const values = <ActivityReponseDtoTypeEnum>[
    comment,
    like,
  ];

  static ActivityReponseDtoTypeEnum? fromJson(dynamic value) => ActivityReponseDtoTypeEnumTypeTransformer().decode(value);

  static List<ActivityReponseDtoTypeEnum>? listFromJson(dynamic json, {bool growable = false,}) {
    final result = <ActivityReponseDtoTypeEnum>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = ActivityReponseDtoTypeEnum.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }
}

/// Transformation class that can [encode] an instance of [ActivityReponseDtoTypeEnum] to String,
/// and [decode] dynamic data back to [ActivityReponseDtoTypeEnum].
class ActivityReponseDtoTypeEnumTypeTransformer {
  factory ActivityReponseDtoTypeEnumTypeTransformer() => _instance ??= const ActivityReponseDtoTypeEnumTypeTransformer._();

  const ActivityReponseDtoTypeEnumTypeTransformer._();

  String encode(ActivityReponseDtoTypeEnum data) => data.value;

  /// Decodes a [dynamic value][data] to a ActivityReponseDtoTypeEnum.
  ///
  /// If [allowNull] is true and the [dynamic value][data] cannot be decoded successfully,
  /// then null is returned. However, if [allowNull] is false and the [dynamic value][data]
  /// cannot be decoded successfully, then an [UnimplementedError] is thrown.
  ///
  /// The [allowNull] is very handy when an API changes and a new enum value is added or removed,
  /// and users are still using an old app with the old code.
  ActivityReponseDtoTypeEnum? decode(dynamic data, {bool allowNull = true}) {
    if (data != null) {
      switch (data) {
        case r'comment': return ActivityReponseDtoTypeEnum.comment;
        case r'like': return ActivityReponseDtoTypeEnum.like;
        default:
          if (!allowNull) {
            throw ArgumentError('Unknown enum value to decode: $data');
          }
      }
    }
    return null;
  }

  /// Singleton [ActivityReponseDtoTypeEnumTypeTransformer] instance.
  static ActivityReponseDtoTypeEnumTypeTransformer? _instance;
}


