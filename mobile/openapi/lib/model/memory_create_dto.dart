//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class MemoryCreateDto {
  /// Returns a new [MemoryCreateDto] instance.
  MemoryCreateDto({
    this.assetIds = const [],
    required this.data,
    this.isSaved,
    required this.memoryAt,
    this.seenAt,
    required this.type,
  });

  /// Asset IDs to associate with memory
  List<String> assetIds;

  OnThisDayDto data;

  /// Is memory saved
  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  bool? isSaved;

  /// Memory date
  DateTime memoryAt;

  /// Date when memory was seen
  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  DateTime? seenAt;

  /// Memory type
  MemoryCreateDtoTypeEnum type;

  @override
  bool operator ==(Object other) => identical(this, other) || other is MemoryCreateDto &&
    _deepEquality.equals(other.assetIds, assetIds) &&
    other.data == data &&
    other.isSaved == isSaved &&
    other.memoryAt == memoryAt &&
    other.seenAt == seenAt &&
    other.type == type;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (assetIds.hashCode) +
    (data.hashCode) +
    (isSaved == null ? 0 : isSaved!.hashCode) +
    (memoryAt.hashCode) +
    (seenAt == null ? 0 : seenAt!.hashCode) +
    (type.hashCode);

  @override
  String toString() => 'MemoryCreateDto[assetIds=$assetIds, data=$data, isSaved=$isSaved, memoryAt=$memoryAt, seenAt=$seenAt, type=$type]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'assetIds'] = this.assetIds;
      json[r'data'] = this.data;
    if (this.isSaved != null) {
      json[r'isSaved'] = this.isSaved;
    } else {
    //  json[r'isSaved'] = null;
    }
      json[r'memoryAt'] = _isEpochMarker(r'/^(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))T(?:(?:[01]\\d|2[0-3]):[0-5]\\d(?::[0-5]\\d(?:\\.\\d+)?)?(?:Z))$/')
        ? this.memoryAt.millisecondsSinceEpoch
        : this.memoryAt.toUtc().toIso8601String();
    if (this.seenAt != null) {
      json[r'seenAt'] = _isEpochMarker(r'/^(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))T(?:(?:[01]\\d|2[0-3]):[0-5]\\d(?::[0-5]\\d(?:\\.\\d+)?)?(?:Z))$/')
        ? this.seenAt!.millisecondsSinceEpoch
        : this.seenAt!.toUtc().toIso8601String();
    } else {
    //  json[r'seenAt'] = null;
    }
      json[r'type'] = this.type;
    return json;
  }

  /// Returns a new [MemoryCreateDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static MemoryCreateDto? fromJson(dynamic value) {
    upgradeDto(value, "MemoryCreateDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return MemoryCreateDto(
        assetIds: json[r'assetIds'] is Iterable
            ? (json[r'assetIds'] as Iterable).cast<String>().toList(growable: false)
            : const [],
        data: OnThisDayDto.fromJson(json[r'data'])!,
        isSaved: mapValueOfType<bool>(json, r'isSaved'),
        memoryAt: mapDateTime(json, r'memoryAt', r'/^(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))T(?:(?:[01]\\d|2[0-3]):[0-5]\\d(?::[0-5]\\d(?:\\.\\d+)?)?(?:Z))$/')!,
        seenAt: mapDateTime(json, r'seenAt', r'/^(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))T(?:(?:[01]\\d|2[0-3]):[0-5]\\d(?::[0-5]\\d(?:\\.\\d+)?)?(?:Z))$/'),
        type: MemoryCreateDtoTypeEnum.fromJson(json[r'type'])!,
      );
    }
    return null;
  }

  static List<MemoryCreateDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <MemoryCreateDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = MemoryCreateDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, MemoryCreateDto> mapFromJson(dynamic json) {
    final map = <String, MemoryCreateDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = MemoryCreateDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of MemoryCreateDto-objects as value to a dart map
  static Map<String, List<MemoryCreateDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<MemoryCreateDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = MemoryCreateDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'data',
    'memoryAt',
    'type',
  };
}

/// Memory type
class MemoryCreateDtoTypeEnum {
  /// Instantiate a new enum with the provided [value].
  const MemoryCreateDtoTypeEnum._(this.value);

  /// The underlying value of this enum member.
  final String value;

  @override
  String toString() => value;

  String toJson() => value;

  static const onThisDay = MemoryCreateDtoTypeEnum._(r'on_this_day');

  /// List of all possible values in this [enum][MemoryCreateDtoTypeEnum].
  static const values = <MemoryCreateDtoTypeEnum>[
    onThisDay,
  ];

  static MemoryCreateDtoTypeEnum? fromJson(dynamic value) => MemoryCreateDtoTypeEnumTypeTransformer().decode(value);

  static List<MemoryCreateDtoTypeEnum> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <MemoryCreateDtoTypeEnum>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = MemoryCreateDtoTypeEnum.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }
}

/// Transformation class that can [encode] an instance of [MemoryCreateDtoTypeEnum] to String,
/// and [decode] dynamic data back to [MemoryCreateDtoTypeEnum].
class MemoryCreateDtoTypeEnumTypeTransformer {
  factory MemoryCreateDtoTypeEnumTypeTransformer() => _instance ??= const MemoryCreateDtoTypeEnumTypeTransformer._();

  const MemoryCreateDtoTypeEnumTypeTransformer._();

  String encode(MemoryCreateDtoTypeEnum data) => data.value;

  /// Decodes a [dynamic value][data] to a MemoryCreateDtoTypeEnum.
  ///
  /// If [allowNull] is true and the [dynamic value][data] cannot be decoded successfully,
  /// then null is returned. However, if [allowNull] is false and the [dynamic value][data]
  /// cannot be decoded successfully, then an [UnimplementedError] is thrown.
  ///
  /// The [allowNull] is very handy when an API changes and a new enum value is added or removed,
  /// and users are still using an old app with the old code.
  MemoryCreateDtoTypeEnum? decode(dynamic data, {bool allowNull = true}) {
    if (data != null) {
      switch (data) {
        case r'on_this_day': return MemoryCreateDtoTypeEnum.onThisDay;
        default:
          if (!allowNull) {
            throw ArgumentError('Unknown enum value to decode: $data');
          }
      }
    }
    return null;
  }

  /// Singleton [MemoryCreateDtoTypeEnumTypeTransformer] instance.
  static MemoryCreateDtoTypeEnumTypeTransformer? _instance;
}


