//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class IntegrityGetReportDto {
  /// Returns a new [IntegrityGetReportDto] instance.
  IntegrityGetReportDto({
    this.cursor,
    this.limit,
    required this.type,
  });

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  DateTime? cursor;

  /// Minimum value: 1
  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  num? limit;

  IntegrityReportType type;

  @override
  bool operator ==(Object other) => identical(this, other) || other is IntegrityGetReportDto &&
    other.cursor == cursor &&
    other.limit == limit &&
    other.type == type;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (cursor == null ? 0 : cursor!.hashCode) +
    (limit == null ? 0 : limit!.hashCode) +
    (type.hashCode);

  @override
  String toString() => 'IntegrityGetReportDto[cursor=$cursor, limit=$limit, type=$type]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    if (this.cursor != null) {
      json[r'cursor'] = this.cursor!.toUtc().toIso8601String();
    } else {
    //  json[r'cursor'] = null;
    }
    if (this.limit != null) {
      json[r'limit'] = this.limit;
    } else {
    //  json[r'limit'] = null;
    }
      json[r'type'] = this.type;
    return json;
  }

  /// Returns a new [IntegrityGetReportDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static IntegrityGetReportDto? fromJson(dynamic value) {
    upgradeDto(value, "IntegrityGetReportDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return IntegrityGetReportDto(
        cursor: mapDateTime(json, r'cursor', r''),
        limit: num.parse('${json[r'limit']}'),
        type: IntegrityReportType.fromJson(json[r'type'])!,
      );
    }
    return null;
  }

  static List<IntegrityGetReportDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <IntegrityGetReportDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = IntegrityGetReportDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, IntegrityGetReportDto> mapFromJson(dynamic json) {
    final map = <String, IntegrityGetReportDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = IntegrityGetReportDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of IntegrityGetReportDto-objects as value to a dart map
  static Map<String, List<IntegrityGetReportDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<IntegrityGetReportDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = IntegrityGetReportDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'type',
  };
}

