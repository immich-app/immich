//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class MemoryUpdateDto {
  /// Returns a new [MemoryUpdateDto] instance.
  MemoryUpdateDto({
    this.isSaved,
    this.memoryAt,
    this.seenAt,
  });

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  bool? isSaved;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  DateTime? memoryAt;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  DateTime? seenAt;

  @override
  bool operator ==(Object other) => identical(this, other) || other is MemoryUpdateDto &&
    other.isSaved == isSaved &&
    other.memoryAt == memoryAt &&
    other.seenAt == seenAt;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (isSaved == null ? 0 : isSaved!.hashCode) +
    (memoryAt == null ? 0 : memoryAt!.hashCode) +
    (seenAt == null ? 0 : seenAt!.hashCode);

  @override
  String toString() => 'MemoryUpdateDto[isSaved=$isSaved, memoryAt=$memoryAt, seenAt=$seenAt]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    if (this.isSaved != null) {
      json[r'isSaved'] = this.isSaved;
    } else {
    //  json[r'isSaved'] = null;
    }
    if (this.memoryAt != null) {
      json[r'memoryAt'] = this.memoryAt!.toUtc().toIso8601String();
    } else {
    //  json[r'memoryAt'] = null;
    }
    if (this.seenAt != null) {
      json[r'seenAt'] = this.seenAt!.toUtc().toIso8601String();
    } else {
    //  json[r'seenAt'] = null;
    }
    return json;
  }

  /// Returns a new [MemoryUpdateDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static MemoryUpdateDto? fromJson(dynamic value) {
    upgradeDto(value, "MemoryUpdateDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return MemoryUpdateDto(
        isSaved: mapValueOfType<bool>(json, r'isSaved'),
        memoryAt: mapDateTime(json, r'memoryAt', r''),
        seenAt: mapDateTime(json, r'seenAt', r''),
      );
    }
    return null;
  }

  static List<MemoryUpdateDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <MemoryUpdateDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = MemoryUpdateDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, MemoryUpdateDto> mapFromJson(dynamic json) {
    final map = <String, MemoryUpdateDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = MemoryUpdateDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of MemoryUpdateDto-objects as value to a dart map
  static Map<String, List<MemoryUpdateDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<MemoryUpdateDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = MemoryUpdateDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
  };
}

