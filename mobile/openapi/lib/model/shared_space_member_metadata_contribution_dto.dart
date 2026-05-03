//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class SharedSpaceMemberMetadataContributionDto {
  /// Returns a new [SharedSpaceMemberMetadataContributionDto] instance.
  SharedSpaceMemberMetadataContributionDto({
    required this.sharePersonMetadata,
  });

  /// Disable person metadata contribution for this member
  bool sharePersonMetadata;

  @override
  bool operator ==(Object other) => identical(this, other) || other is SharedSpaceMemberMetadataContributionDto &&
    other.sharePersonMetadata == sharePersonMetadata;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (sharePersonMetadata.hashCode);

  @override
  String toString() => 'SharedSpaceMemberMetadataContributionDto[sharePersonMetadata=$sharePersonMetadata]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'sharePersonMetadata'] = this.sharePersonMetadata;
    return json;
  }

  /// Returns a new [SharedSpaceMemberMetadataContributionDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static SharedSpaceMemberMetadataContributionDto? fromJson(dynamic value) {
    upgradeDto(value, "SharedSpaceMemberMetadataContributionDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return SharedSpaceMemberMetadataContributionDto(
        sharePersonMetadata: mapValueOfType<bool>(json, r'sharePersonMetadata')!,
      );
    }
    return null;
  }

  static List<SharedSpaceMemberMetadataContributionDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <SharedSpaceMemberMetadataContributionDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = SharedSpaceMemberMetadataContributionDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, SharedSpaceMemberMetadataContributionDto> mapFromJson(dynamic json) {
    final map = <String, SharedSpaceMemberMetadataContributionDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = SharedSpaceMemberMetadataContributionDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of SharedSpaceMemberMetadataContributionDto-objects as value to a dart map
  static Map<String, List<SharedSpaceMemberMetadataContributionDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<SharedSpaceMemberMetadataContributionDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = SharedSpaceMemberMetadataContributionDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'sharePersonMetadata',
  };
}

