//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.12

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class ActivityFavoriteDto {
  /// Returns a new [ActivityFavoriteDto] instance.
  ActivityFavoriteDto({
    required this.favorite,
  });

  bool favorite;

  @override
  bool operator ==(Object other) => identical(this, other) || other is ActivityFavoriteDto &&
     other.favorite == favorite;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (favorite.hashCode);

  @override
  String toString() => 'ActivityFavoriteDto[favorite=$favorite]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'favorite'] = this.favorite;
    return json;
  }

  /// Returns a new [ActivityFavoriteDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static ActivityFavoriteDto? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return ActivityFavoriteDto(
        favorite: mapValueOfType<bool>(json, r'favorite')!,
      );
    }
    return null;
  }

  static List<ActivityFavoriteDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <ActivityFavoriteDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = ActivityFavoriteDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, ActivityFavoriteDto> mapFromJson(dynamic json) {
    final map = <String, ActivityFavoriteDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = ActivityFavoriteDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of ActivityFavoriteDto-objects as value to a dart map
  static Map<String, List<ActivityFavoriteDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<ActivityFavoriteDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = ActivityFavoriteDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'favorite',
  };
}

