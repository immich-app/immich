//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class UserUploadStatsResponseDto {
  /// Returns a new [UserUploadStatsResponseDto] instance.
  UserUploadStatsResponseDto({
    required this.from,
    this.series = const [],
    required this.to,
    required this.totalCount,
    required this.userId,
  });

  /// Start date in UTC
  String from;

  List<UserUploadStatsResponseDtoSeriesInner> series;

  /// End date in UTC
  String to;

  /// Total number of uploads
  ///
  /// Minimum value: 0
  /// Maximum value: 9007199254740991
  int totalCount;

  /// User ID
  String userId;

  @override
  bool operator ==(Object other) => identical(this, other) || other is UserUploadStatsResponseDto &&
    other.from == from &&
    _deepEquality.equals(other.series, series) &&
    other.to == to &&
    other.totalCount == totalCount &&
    other.userId == userId;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (from.hashCode) +
    (series.hashCode) +
    (to.hashCode) +
    (totalCount.hashCode) +
    (userId.hashCode);

  @override
  String toString() => 'UserUploadStatsResponseDto[from=$from, series=$series, to=$to, totalCount=$totalCount, userId=$userId]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'from'] = this.from;
      json[r'series'] = this.series;
      json[r'to'] = this.to;
      json[r'totalCount'] = this.totalCount;
      json[r'userId'] = this.userId;
    return json;
  }

  /// Returns a new [UserUploadStatsResponseDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static UserUploadStatsResponseDto? fromJson(dynamic value) {
    upgradeDto(value, "UserUploadStatsResponseDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return UserUploadStatsResponseDto(
        from: mapValueOfType<String>(json, r'from')!,
        series: UserUploadStatsResponseDtoSeriesInner.listFromJson(json[r'series']),
        to: mapValueOfType<String>(json, r'to')!,
        totalCount: mapValueOfType<int>(json, r'totalCount')!,
        userId: mapValueOfType<String>(json, r'userId')!,
      );
    }
    return null;
  }

  static List<UserUploadStatsResponseDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <UserUploadStatsResponseDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = UserUploadStatsResponseDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, UserUploadStatsResponseDto> mapFromJson(dynamic json) {
    final map = <String, UserUploadStatsResponseDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = UserUploadStatsResponseDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of UserUploadStatsResponseDto-objects as value to a dart map
  static Map<String, List<UserUploadStatsResponseDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<UserUploadStatsResponseDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = UserUploadStatsResponseDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'from',
    'series',
    'to',
    'totalCount',
    'userId',
  };
}

