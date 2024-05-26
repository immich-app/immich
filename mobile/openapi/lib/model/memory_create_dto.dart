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

  List<String> assetIds;

  OnThisDayDto data;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  bool? isSaved;

  DateTime memoryAt;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  DateTime? seenAt;

  MemoryType type;

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
      json[r'memoryAt'] = this.memoryAt.toUtc().toIso8601String();
    if (this.seenAt != null) {
      json[r'seenAt'] = this.seenAt!.toUtc().toIso8601String();
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
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return MemoryCreateDto(
        assetIds: json[r'assetIds'] is Iterable
            ? (json[r'assetIds'] as Iterable).cast<String>().toList(growable: false)
            : const [],
        data: OnThisDayDto.fromJson(json[r'data'])!,
        isSaved: mapValueOfType<bool>(json, r'isSaved'),
        memoryAt: mapDateTime(json, r'memoryAt', r'')!,
        seenAt: mapDateTime(json, r'seenAt', r''),
        type: MemoryType.fromJson(json[r'type'])!,
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

