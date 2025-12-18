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
    this.page,
    this.size,
    required this.type,
  });

  /// Minimum value: 1
  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  num? page;

  /// Minimum value: 1
  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  num? size;

  IntegrityReportType type;

  @override
  bool operator ==(Object other) => identical(this, other) || other is IntegrityGetReportDto &&
    other.page == page &&
    other.size == size &&
    other.type == type;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (page == null ? 0 : page!.hashCode) +
    (size == null ? 0 : size!.hashCode) +
    (type.hashCode);

  @override
  String toString() => 'IntegrityGetReportDto[page=$page, size=$size, type=$type]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    if (this.page != null) {
      json[r'page'] = this.page;
    } else {
    //  json[r'page'] = null;
    }
    if (this.size != null) {
      json[r'size'] = this.size;
    } else {
    //  json[r'size'] = null;
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
        page: num.parse('${json[r'page']}'),
        size: num.parse('${json[r'size']}'),
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

