//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class RetentionPolicyDto {
  /// Returns a new [RetentionPolicyDto] instance.
  RetentionPolicyDto({
    this.keepLast,
    this.keepWithin,
    this.keepWithinDaily,
    this.keepWithinHourly,
    this.keepWithinMonthly,
    this.keepWithinWeekly,
    this.keepWithinYearly,
  });

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  num? keepLast;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  String? keepWithin;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  String? keepWithinDaily;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  String? keepWithinHourly;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  String? keepWithinMonthly;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  String? keepWithinWeekly;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  String? keepWithinYearly;

  @override
  bool operator ==(Object other) => identical(this, other) || other is RetentionPolicyDto &&
    other.keepLast == keepLast &&
    other.keepWithin == keepWithin &&
    other.keepWithinDaily == keepWithinDaily &&
    other.keepWithinHourly == keepWithinHourly &&
    other.keepWithinMonthly == keepWithinMonthly &&
    other.keepWithinWeekly == keepWithinWeekly &&
    other.keepWithinYearly == keepWithinYearly;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (keepLast == null ? 0 : keepLast!.hashCode) +
    (keepWithin == null ? 0 : keepWithin!.hashCode) +
    (keepWithinDaily == null ? 0 : keepWithinDaily!.hashCode) +
    (keepWithinHourly == null ? 0 : keepWithinHourly!.hashCode) +
    (keepWithinMonthly == null ? 0 : keepWithinMonthly!.hashCode) +
    (keepWithinWeekly == null ? 0 : keepWithinWeekly!.hashCode) +
    (keepWithinYearly == null ? 0 : keepWithinYearly!.hashCode);

  @override
  String toString() => 'RetentionPolicyDto[keepLast=$keepLast, keepWithin=$keepWithin, keepWithinDaily=$keepWithinDaily, keepWithinHourly=$keepWithinHourly, keepWithinMonthly=$keepWithinMonthly, keepWithinWeekly=$keepWithinWeekly, keepWithinYearly=$keepWithinYearly]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    if (this.keepLast != null) {
      json[r'keepLast'] = this.keepLast;
    } else {
    //  json[r'keepLast'] = null;
    }
    if (this.keepWithin != null) {
      json[r'keepWithin'] = this.keepWithin;
    } else {
    //  json[r'keepWithin'] = null;
    }
    if (this.keepWithinDaily != null) {
      json[r'keepWithinDaily'] = this.keepWithinDaily;
    } else {
    //  json[r'keepWithinDaily'] = null;
    }
    if (this.keepWithinHourly != null) {
      json[r'keepWithinHourly'] = this.keepWithinHourly;
    } else {
    //  json[r'keepWithinHourly'] = null;
    }
    if (this.keepWithinMonthly != null) {
      json[r'keepWithinMonthly'] = this.keepWithinMonthly;
    } else {
    //  json[r'keepWithinMonthly'] = null;
    }
    if (this.keepWithinWeekly != null) {
      json[r'keepWithinWeekly'] = this.keepWithinWeekly;
    } else {
    //  json[r'keepWithinWeekly'] = null;
    }
    if (this.keepWithinYearly != null) {
      json[r'keepWithinYearly'] = this.keepWithinYearly;
    } else {
    //  json[r'keepWithinYearly'] = null;
    }
    return json;
  }

  /// Returns a new [RetentionPolicyDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static RetentionPolicyDto? fromJson(dynamic value) {
    upgradeDto(value, "RetentionPolicyDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return RetentionPolicyDto(
        keepLast: num.parse('${json[r'keepLast']}'),
        keepWithin: mapValueOfType<String>(json, r'keepWithin'),
        keepWithinDaily: mapValueOfType<String>(json, r'keepWithinDaily'),
        keepWithinHourly: mapValueOfType<String>(json, r'keepWithinHourly'),
        keepWithinMonthly: mapValueOfType<String>(json, r'keepWithinMonthly'),
        keepWithinWeekly: mapValueOfType<String>(json, r'keepWithinWeekly'),
        keepWithinYearly: mapValueOfType<String>(json, r'keepWithinYearly'),
      );
    }
    return null;
  }

  static List<RetentionPolicyDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <RetentionPolicyDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = RetentionPolicyDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, RetentionPolicyDto> mapFromJson(dynamic json) {
    final map = <String, RetentionPolicyDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = RetentionPolicyDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of RetentionPolicyDto-objects as value to a dart map
  static Map<String, List<RetentionPolicyDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<RetentionPolicyDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = RetentionPolicyDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
  };
}

