//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class MemoryResponseDto {
  /// Returns a new [MemoryResponseDto] instance.
  MemoryResponseDto({
    this.assets = const [],
    required this.createdAt,
    required this.data,
    this.deletedAt,
    required this.id,
    required this.isSaved,
    required this.memoryAt,
    required this.ownerId,
    this.seenAt,
    required this.type,
    required this.updatedAt,
  });

  List<AssetResponseDto> assets;

  DateTime createdAt;

  OnThisDayDto data;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  DateTime? deletedAt;

  String id;

  bool isSaved;

  DateTime memoryAt;

  String ownerId;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  DateTime? seenAt;

  MemoryResponseDtoTypeEnum type;

  DateTime updatedAt;

  @override
  bool operator ==(Object other) => identical(this, other) || other is MemoryResponseDto &&
    _deepEquality.equals(other.assets, assets) &&
    other.createdAt == createdAt &&
    other.data == data &&
    other.deletedAt == deletedAt &&
    other.id == id &&
    other.isSaved == isSaved &&
    other.memoryAt == memoryAt &&
    other.ownerId == ownerId &&
    other.seenAt == seenAt &&
    other.type == type &&
    other.updatedAt == updatedAt;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (assets.hashCode) +
    (createdAt.hashCode) +
    (data.hashCode) +
    (deletedAt == null ? 0 : deletedAt!.hashCode) +
    (id.hashCode) +
    (isSaved.hashCode) +
    (memoryAt.hashCode) +
    (ownerId.hashCode) +
    (seenAt == null ? 0 : seenAt!.hashCode) +
    (type.hashCode) +
    (updatedAt.hashCode);

  @override
  String toString() => 'MemoryResponseDto[assets=$assets, createdAt=$createdAt, data=$data, deletedAt=$deletedAt, id=$id, isSaved=$isSaved, memoryAt=$memoryAt, ownerId=$ownerId, seenAt=$seenAt, type=$type, updatedAt=$updatedAt]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'assets'] = this.assets;
      json[r'createdAt'] = this.createdAt.toUtc().toIso8601String();
      json[r'data'] = this.data;
    if (this.deletedAt != null) {
      json[r'deletedAt'] = this.deletedAt!.toUtc().toIso8601String();
    } else {
    //  json[r'deletedAt'] = null;
    }
      json[r'id'] = this.id;
      json[r'isSaved'] = this.isSaved;
      json[r'memoryAt'] = this.memoryAt.toUtc().toIso8601String();
      json[r'ownerId'] = this.ownerId;
    if (this.seenAt != null) {
      json[r'seenAt'] = this.seenAt!.toUtc().toIso8601String();
    } else {
    //  json[r'seenAt'] = null;
    }
      json[r'type'] = this.type;
      json[r'updatedAt'] = this.updatedAt.toUtc().toIso8601String();
    return json;
  }

  /// Returns a new [MemoryResponseDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static MemoryResponseDto? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return MemoryResponseDto(
        assets: AssetResponseDto.listFromJson(json[r'assets']),
        createdAt: mapDateTime(json, r'createdAt', r'')!,
        data: OnThisDayDto.fromJson(json[r'data'])!,
        deletedAt: mapDateTime(json, r'deletedAt', r''),
        id: mapValueOfType<String>(json, r'id')!,
        isSaved: mapValueOfType<bool>(json, r'isSaved')!,
        memoryAt: mapDateTime(json, r'memoryAt', r'')!,
        ownerId: mapValueOfType<String>(json, r'ownerId')!,
        seenAt: mapDateTime(json, r'seenAt', r''),
        type: MemoryResponseDtoTypeEnum.fromJson(json[r'type'])!,
        updatedAt: mapDateTime(json, r'updatedAt', r'')!,
      );
    }
    return null;
  }

  static List<MemoryResponseDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <MemoryResponseDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = MemoryResponseDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, MemoryResponseDto> mapFromJson(dynamic json) {
    final map = <String, MemoryResponseDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = MemoryResponseDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of MemoryResponseDto-objects as value to a dart map
  static Map<String, List<MemoryResponseDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<MemoryResponseDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = MemoryResponseDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'assets',
    'createdAt',
    'data',
    'id',
    'isSaved',
    'memoryAt',
    'ownerId',
    'type',
    'updatedAt',
  };
}


class MemoryResponseDtoTypeEnum {
  /// Instantiate a new enum with the provided [value].
  const MemoryResponseDtoTypeEnum._(this.value);

  /// The underlying value of this enum member.
  final String value;

  @override
  String toString() => value;

  String toJson() => value;

  static const onThisDay = MemoryResponseDtoTypeEnum._(r'on_this_day');

  /// List of all possible values in this [enum][MemoryResponseDtoTypeEnum].
  static const values = <MemoryResponseDtoTypeEnum>[
    onThisDay,
  ];

  static MemoryResponseDtoTypeEnum? fromJson(dynamic value) => MemoryResponseDtoTypeEnumTypeTransformer().decode(value);

  static List<MemoryResponseDtoTypeEnum> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <MemoryResponseDtoTypeEnum>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = MemoryResponseDtoTypeEnum.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }
}

/// Transformation class that can [encode] an instance of [MemoryResponseDtoTypeEnum] to String,
/// and [decode] dynamic data back to [MemoryResponseDtoTypeEnum].
class MemoryResponseDtoTypeEnumTypeTransformer {
  factory MemoryResponseDtoTypeEnumTypeTransformer() => _instance ??= const MemoryResponseDtoTypeEnumTypeTransformer._();

  const MemoryResponseDtoTypeEnumTypeTransformer._();

  String encode(MemoryResponseDtoTypeEnum data) => data.value;

  /// Decodes a [dynamic value][data] to a MemoryResponseDtoTypeEnum.
  ///
  /// If [allowNull] is true and the [dynamic value][data] cannot be decoded successfully,
  /// then null is returned. However, if [allowNull] is false and the [dynamic value][data]
  /// cannot be decoded successfully, then an [UnimplementedError] is thrown.
  ///
  /// The [allowNull] is very handy when an API changes and a new enum value is added or removed,
  /// and users are still using an old app with the old code.
  MemoryResponseDtoTypeEnum? decode(dynamic data, {bool allowNull = true}) {
    if (data != null) {
      switch (data) {
        case r'on_this_day': return MemoryResponseDtoTypeEnum.onThisDay;
        default:
          if (!allowNull) {
            throw ArgumentError('Unknown enum value to decode: $data');
          }
      }
    }
    return null;
  }

  /// Singleton [MemoryResponseDtoTypeEnumTypeTransformer] instance.
  static MemoryResponseDtoTypeEnumTypeTransformer? _instance;
}


