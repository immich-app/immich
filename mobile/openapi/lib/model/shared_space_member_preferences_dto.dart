//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class SharedSpaceMemberPreferencesDto {
  /// Returns a new [SharedSpaceMemberPreferencesDto] instance.
  SharedSpaceMemberPreferencesDto({
    this.sharePersonMetadata,
    this.showInTimeline,
  });

  /// Share person names and birth dates with this space
  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  bool? sharePersonMetadata;

  /// Show space assets in personal timeline
  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  bool? showInTimeline;

  @override
  bool operator ==(Object other) => identical(this, other) || other is SharedSpaceMemberPreferencesDto &&
    other.sharePersonMetadata == sharePersonMetadata &&
    other.showInTimeline == showInTimeline;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (sharePersonMetadata == null ? 0 : sharePersonMetadata!.hashCode) +
    (showInTimeline == null ? 0 : showInTimeline!.hashCode);

  @override
  String toString() => 'SharedSpaceMemberPreferencesDto[sharePersonMetadata=$sharePersonMetadata, showInTimeline=$showInTimeline]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    if (this.sharePersonMetadata != null) {
      json[r'sharePersonMetadata'] = this.sharePersonMetadata;
    } else {
    //  json[r'sharePersonMetadata'] = null;
    }
    if (this.showInTimeline != null) {
      json[r'showInTimeline'] = this.showInTimeline;
    } else {
    //  json[r'showInTimeline'] = null;
    }
    return json;
  }

  /// Returns a new [SharedSpaceMemberPreferencesDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static SharedSpaceMemberPreferencesDto? fromJson(dynamic value) {
    upgradeDto(value, "SharedSpaceMemberPreferencesDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return SharedSpaceMemberPreferencesDto(
        sharePersonMetadata: mapValueOfType<bool>(json, r'sharePersonMetadata'),
        showInTimeline: mapValueOfType<bool>(json, r'showInTimeline'),
      );
    }
    return null;
  }

  static List<SharedSpaceMemberPreferencesDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <SharedSpaceMemberPreferencesDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = SharedSpaceMemberPreferencesDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, SharedSpaceMemberPreferencesDto> mapFromJson(dynamic json) {
    final map = <String, SharedSpaceMemberPreferencesDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = SharedSpaceMemberPreferencesDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of SharedSpaceMemberPreferencesDto-objects as value to a dart map
  static Map<String, List<SharedSpaceMemberPreferencesDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<SharedSpaceMemberPreferencesDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = SharedSpaceMemberPreferencesDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
  };
}

