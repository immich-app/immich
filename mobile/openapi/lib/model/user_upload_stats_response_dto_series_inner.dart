//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class UserUploadStatsResponseDtoSeriesInner {
  /// Returns a new [UserUploadStatsResponseDtoSeriesInner] instance.
  UserUploadStatsResponseDtoSeriesInner({
    required this.count,
    required this.date,
  });

  /// Number of uploads
  ///
  /// Minimum value: -9007199254740991
  /// Maximum value: 9007199254740991
  int count;

  /// Date in UTC
  String date;

  @override
  bool operator ==(Object other) => identical(this, other) || other is UserUploadStatsResponseDtoSeriesInner &&
    other.count == count &&
    other.date == date;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (count.hashCode) +
    (date.hashCode);

  @override
  String toString() => 'UserUploadStatsResponseDtoSeriesInner[count=$count, date=$date]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'count'] = this.count;
      json[r'date'] = this.date;
    return json;
  }

  /// Returns a new [UserUploadStatsResponseDtoSeriesInner] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static UserUploadStatsResponseDtoSeriesInner? fromJson(dynamic value) {
    upgradeDto(value, "UserUploadStatsResponseDtoSeriesInner");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return UserUploadStatsResponseDtoSeriesInner(
        count: mapValueOfType<int>(json, r'count')!,
        date: mapValueOfType<String>(json, r'date')!,
      );
    }
    return null;
  }

  static List<UserUploadStatsResponseDtoSeriesInner> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <UserUploadStatsResponseDtoSeriesInner>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = UserUploadStatsResponseDtoSeriesInner.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, UserUploadStatsResponseDtoSeriesInner> mapFromJson(dynamic json) {
    final map = <String, UserUploadStatsResponseDtoSeriesInner>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = UserUploadStatsResponseDtoSeriesInner.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of UserUploadStatsResponseDtoSeriesInner-objects as value to a dart map
  static Map<String, List<UserUploadStatsResponseDtoSeriesInner>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<UserUploadStatsResponseDtoSeriesInner>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = UserUploadStatsResponseDtoSeriesInner.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'count',
    'date',
  };
}

