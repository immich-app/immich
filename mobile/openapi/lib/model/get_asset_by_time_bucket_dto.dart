//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.12

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class GetAssetByTimeBucketDto {
  /// Returns a new [GetAssetByTimeBucketDto] instance.
  GetAssetByTimeBucketDto({
    this.timeBucket = const [],
    this.userId,
    this.withoutThumbs,
  });

  List<String> timeBucket;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  String? userId;

  /// Include assets without thumbnails
  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  bool? withoutThumbs;

  @override
  bool operator ==(Object other) => identical(this, other) || other is GetAssetByTimeBucketDto &&
     other.timeBucket == timeBucket &&
     other.userId == userId &&
     other.withoutThumbs == withoutThumbs;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (timeBucket.hashCode) +
    (userId == null ? 0 : userId!.hashCode) +
    (withoutThumbs == null ? 0 : withoutThumbs!.hashCode);

  @override
  String toString() => 'GetAssetByTimeBucketDto[timeBucket=$timeBucket, userId=$userId, withoutThumbs=$withoutThumbs]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'timeBucket'] = this.timeBucket;
    if (this.userId != null) {
      json[r'userId'] = this.userId;
    } else {
      // json[r'userId'] = null;
    }
    if (this.withoutThumbs != null) {
      json[r'withoutThumbs'] = this.withoutThumbs;
    } else {
      // json[r'withoutThumbs'] = null;
    }
    return json;
  }

  /// Returns a new [GetAssetByTimeBucketDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static GetAssetByTimeBucketDto? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      // Ensure that the map contains the required keys.
      // Note 1: the values aren't checked for validity beyond being non-null.
      // Note 2: this code is stripped in release mode!
      assert(() {
        requiredKeys.forEach((key) {
          assert(json.containsKey(key), 'Required key "GetAssetByTimeBucketDto[$key]" is missing from JSON.');
          // assert(json[key] != null, 'Required key "GetAssetByTimeBucketDto[$key]" has a null value in JSON.');
        });
        return true;
      }());

      return GetAssetByTimeBucketDto(
        timeBucket: json[r'timeBucket'] is Iterable
            ? (json[r'timeBucket'] as Iterable).cast<String>().toList(growable: false)
            : const [],
        userId: mapValueOfType<String>(json, r'userId'),
        withoutThumbs: mapValueOfType<bool>(json, r'withoutThumbs'),
      );
    }
    return null;
  }

  static List<GetAssetByTimeBucketDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <GetAssetByTimeBucketDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = GetAssetByTimeBucketDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, GetAssetByTimeBucketDto> mapFromJson(dynamic json) {
    final map = <String, GetAssetByTimeBucketDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = GetAssetByTimeBucketDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of GetAssetByTimeBucketDto-objects as value to a dart map
  static Map<String, List<GetAssetByTimeBucketDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<GetAssetByTimeBucketDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = GetAssetByTimeBucketDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'timeBucket',
  };
}

