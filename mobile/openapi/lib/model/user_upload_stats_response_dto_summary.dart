//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class UserUploadStatsResponseDtoSummary {
  /// Returns a new [UserUploadStatsResponseDtoSummary] instance.
  UserUploadStatsResponseDtoSummary({
    required this.totalCount,
  });

  /// Total number of uploads
  ///
  /// Minimum value: -9007199254740991
  /// Maximum value: 9007199254740991
  int totalCount;

  @override
  bool operator ==(Object other) => identical(this, other) || other is UserUploadStatsResponseDtoSummary &&
    other.totalCount == totalCount;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (totalCount.hashCode);

  @override
  String toString() => 'UserUploadStatsResponseDtoSummary[totalCount=$totalCount]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'totalCount'] = this.totalCount;
    return json;
  }

  /// Returns a new [UserUploadStatsResponseDtoSummary] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static UserUploadStatsResponseDtoSummary? fromJson(dynamic value) {
    upgradeDto(value, "UserUploadStatsResponseDtoSummary");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return UserUploadStatsResponseDtoSummary(
        totalCount: mapValueOfType<int>(json, r'totalCount')!,
      );
    }
    return null;
  }

  static List<UserUploadStatsResponseDtoSummary> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <UserUploadStatsResponseDtoSummary>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = UserUploadStatsResponseDtoSummary.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, UserUploadStatsResponseDtoSummary> mapFromJson(dynamic json) {
    final map = <String, UserUploadStatsResponseDtoSummary>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = UserUploadStatsResponseDtoSummary.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of UserUploadStatsResponseDtoSummary-objects as value to a dart map
  static Map<String, List<UserUploadStatsResponseDtoSummary>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<UserUploadStatsResponseDtoSummary>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = UserUploadStatsResponseDtoSummary.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'totalCount',
  };
}

