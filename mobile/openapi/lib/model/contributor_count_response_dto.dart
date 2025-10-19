//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class ContributorCountResponseDto {
  /// Returns a new [ContributorCountResponseDto] instance.
  ContributorCountResponseDto({
    required this.assetCount,
    required this.userId,
  });

  int assetCount;

  String userId;

  @override
  bool operator ==(Object other) => identical(this, other) || other is ContributorCountResponseDto &&
    other.assetCount == assetCount &&
    other.userId == userId;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (assetCount.hashCode) +
    (userId.hashCode);

  @override
  String toString() => 'ContributorCountResponseDto[assetCount=$assetCount, userId=$userId]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'assetCount'] = this.assetCount;
      json[r'userId'] = this.userId;
    return json;
  }

  /// Returns a new [ContributorCountResponseDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static ContributorCountResponseDto? fromJson(dynamic value) {
    upgradeDto(value, "ContributorCountResponseDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return ContributorCountResponseDto(
        assetCount: mapValueOfType<int>(json, r'assetCount')!,
        userId: mapValueOfType<String>(json, r'userId')!,
      );
    }
    return null;
  }

  static List<ContributorCountResponseDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <ContributorCountResponseDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = ContributorCountResponseDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, ContributorCountResponseDto> mapFromJson(dynamic json) {
    final map = <String, ContributorCountResponseDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = ContributorCountResponseDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of ContributorCountResponseDto-objects as value to a dart map
  static Map<String, List<ContributorCountResponseDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<ContributorCountResponseDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = ContributorCountResponseDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'assetCount',
    'userId',
  };
}

