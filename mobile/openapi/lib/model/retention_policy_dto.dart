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
    this.keepLast = const Optional.absent(),
    this.keepWithin = const Optional.absent(),
    this.keepWithinDaily = const Optional.absent(),
    this.keepWithinHourly = const Optional.absent(),
    this.keepWithinMonthly = const Optional.absent(),
    this.keepWithinWeekly = const Optional.absent(),
    this.keepWithinYearly = const Optional.absent(),
  });

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  Optional<num?> keepLast;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  Optional<String?> keepWithin;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  Optional<String?> keepWithinDaily;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  Optional<String?> keepWithinHourly;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  Optional<String?> keepWithinMonthly;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  Optional<String?> keepWithinWeekly;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  Optional<String?> keepWithinYearly;

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
    if (this.keepLast.isPresent) {
      final value = this.keepLast.value;
      json[r'keepLast'] = value;
    }
    if (this.keepWithin.isPresent) {
      final value = this.keepWithin.value;
      json[r'keepWithin'] = value;
    }
    if (this.keepWithinDaily.isPresent) {
      final value = this.keepWithinDaily.value;
      json[r'keepWithinDaily'] = value;
    }
    if (this.keepWithinHourly.isPresent) {
      final value = this.keepWithinHourly.value;
      json[r'keepWithinHourly'] = value;
    }
    if (this.keepWithinMonthly.isPresent) {
      final value = this.keepWithinMonthly.value;
      json[r'keepWithinMonthly'] = value;
    }
    if (this.keepWithinWeekly.isPresent) {
      final value = this.keepWithinWeekly.value;
      json[r'keepWithinWeekly'] = value;
    }
    if (this.keepWithinYearly.isPresent) {
      final value = this.keepWithinYearly.value;
      json[r'keepWithinYearly'] = value;
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
        keepLast: json.containsKey(r'keepLast') ? Optional.present(json[r'keepLast'] == null ? null : num.parse('${json[r'keepLast']}')) : const Optional.absent(),
        keepWithin: json.containsKey(r'keepWithin') ? Optional.present(mapValueOfType<String>(json, r'keepWithin')) : const Optional.absent(),
        keepWithinDaily: json.containsKey(r'keepWithinDaily') ? Optional.present(mapValueOfType<String>(json, r'keepWithinDaily')) : const Optional.absent(),
        keepWithinHourly: json.containsKey(r'keepWithinHourly') ? Optional.present(mapValueOfType<String>(json, r'keepWithinHourly')) : const Optional.absent(),
        keepWithinMonthly: json.containsKey(r'keepWithinMonthly') ? Optional.present(mapValueOfType<String>(json, r'keepWithinMonthly')) : const Optional.absent(),
        keepWithinWeekly: json.containsKey(r'keepWithinWeekly') ? Optional.present(mapValueOfType<String>(json, r'keepWithinWeekly')) : const Optional.absent(),
        keepWithinYearly: json.containsKey(r'keepWithinYearly') ? Optional.present(mapValueOfType<String>(json, r'keepWithinYearly')) : const Optional.absent(),
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

