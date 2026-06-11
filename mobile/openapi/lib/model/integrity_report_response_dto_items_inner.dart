//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class IntegrityReportResponseDtoItemsInner {
  /// Returns a new [IntegrityReportResponseDtoItemsInner] instance.
  IntegrityReportResponseDtoItemsInner({
    required this.id,
    required this.path,
    required this.type,
  });

  /// Integrity report item id
  String id;

  /// Integrity report item path
  String path;

  IntegrityReport type;

  @override
  bool operator ==(Object other) => identical(this, other) || other is IntegrityReportResponseDtoItemsInner &&
    other.id == id &&
    other.path == path &&
    other.type == type;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (id.hashCode) +
    (path.hashCode) +
    (type.hashCode);

  @override
  String toString() => 'IntegrityReportResponseDtoItemsInner[id=$id, path=$path, type=$type]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'id'] = this.id;
      json[r'path'] = this.path;
      json[r'type'] = this.type;
    return json;
  }

  /// Returns a new [IntegrityReportResponseDtoItemsInner] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static IntegrityReportResponseDtoItemsInner? fromJson(dynamic value) {
    upgradeDto(value, "IntegrityReportResponseDtoItemsInner");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return IntegrityReportResponseDtoItemsInner(
        id: mapValueOfType<String>(json, r'id')!,
        path: mapValueOfType<String>(json, r'path')!,
        type: IntegrityReport.fromJson(json[r'type'])!,
      );
    }
    return null;
  }

  static List<IntegrityReportResponseDtoItemsInner> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <IntegrityReportResponseDtoItemsInner>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = IntegrityReportResponseDtoItemsInner.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, IntegrityReportResponseDtoItemsInner> mapFromJson(dynamic json) {
    final map = <String, IntegrityReportResponseDtoItemsInner>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = IntegrityReportResponseDtoItemsInner.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of IntegrityReportResponseDtoItemsInner-objects as value to a dart map
  static Map<String, List<IntegrityReportResponseDtoItemsInner>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<IntegrityReportResponseDtoItemsInner>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = IntegrityReportResponseDtoItemsInner.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'id',
    'path',
    'type',
  };
}

