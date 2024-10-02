//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class AuditDeletesResponseDto {
  /// Returns a new [AuditDeletesResponseDto] instance.
  AuditDeletesResponseDto({
    this.ids = const [],
    required this.needsFullSync,
  });

  List<String> ids;

  bool needsFullSync;

  @override
  bool operator ==(Object other) => identical(this, other) || other is AuditDeletesResponseDto &&
    _deepEquality.equals(other.ids, ids) &&
    other.needsFullSync == needsFullSync;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (ids.hashCode) +
    (needsFullSync.hashCode);

  @override
  String toString() => 'AuditDeletesResponseDto[ids=$ids, needsFullSync=$needsFullSync]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'ids'] = this.ids;
      json[r'needsFullSync'] = this.needsFullSync;
    return json;
  }

  /// Returns a new [AuditDeletesResponseDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static AuditDeletesResponseDto? fromJson(dynamic value) {
    upgradeDto(value, "AuditDeletesResponseDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return AuditDeletesResponseDto(
        ids: json[r'ids'] is Iterable
            ? (json[r'ids'] as Iterable).cast<String>().toList(growable: false)
            : const [],
        needsFullSync: mapValueOfType<bool>(json, r'needsFullSync')!,
      );
    }
    return null;
  }

  static List<AuditDeletesResponseDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <AuditDeletesResponseDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = AuditDeletesResponseDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, AuditDeletesResponseDto> mapFromJson(dynamic json) {
    final map = <String, AuditDeletesResponseDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = AuditDeletesResponseDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of AuditDeletesResponseDto-objects as value to a dart map
  static Map<String, List<AuditDeletesResponseDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<AuditDeletesResponseDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = AuditDeletesResponseDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'ids',
    'needsFullSync',
  };
}

