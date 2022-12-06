//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.12

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class UpdateFFmpegSystemConfigDto {
  /// Returns a new [UpdateFFmpegSystemConfigDto] instance.
  UpdateFFmpegSystemConfigDto({
    this.crf,
    this.preset,
    this.targetVideoCodec,
    this.targetAudioCodec,
    this.targetScaling,
  });

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  String? crf;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  String? preset;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  String? targetVideoCodec;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  String? targetAudioCodec;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  String? targetScaling;

  @override
  bool operator ==(Object other) => identical(this, other) || other is UpdateFFmpegSystemConfigDto &&
     other.crf == crf &&
     other.preset == preset &&
     other.targetVideoCodec == targetVideoCodec &&
     other.targetAudioCodec == targetAudioCodec &&
     other.targetScaling == targetScaling;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (crf == null ? 0 : crf!.hashCode) +
    (preset == null ? 0 : preset!.hashCode) +
    (targetVideoCodec == null ? 0 : targetVideoCodec!.hashCode) +
    (targetAudioCodec == null ? 0 : targetAudioCodec!.hashCode) +
    (targetScaling == null ? 0 : targetScaling!.hashCode);

  @override
  String toString() => 'UpdateFFmpegSystemConfigDto[crf=$crf, preset=$preset, targetVideoCodec=$targetVideoCodec, targetAudioCodec=$targetAudioCodec, targetScaling=$targetScaling]';

  Map<String, dynamic> toJson() {
    final _json = <String, dynamic>{};
    if (crf != null) {
      _json[r'crf'] = crf;
    } else {
      _json[r'crf'] = null;
    }
    if (preset != null) {
      _json[r'preset'] = preset;
    } else {
      _json[r'preset'] = null;
    }
    if (targetVideoCodec != null) {
      _json[r'targetVideoCodec'] = targetVideoCodec;
    } else {
      _json[r'targetVideoCodec'] = null;
    }
    if (targetAudioCodec != null) {
      _json[r'targetAudioCodec'] = targetAudioCodec;
    } else {
      _json[r'targetAudioCodec'] = null;
    }
    if (targetScaling != null) {
      _json[r'targetScaling'] = targetScaling;
    } else {
      _json[r'targetScaling'] = null;
    }
    return _json;
  }

  /// Returns a new [UpdateFFmpegSystemConfigDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static UpdateFFmpegSystemConfigDto? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      // Ensure that the map contains the required keys.
      // Note 1: the values aren't checked for validity beyond being non-null.
      // Note 2: this code is stripped in release mode!
      assert(() {
        requiredKeys.forEach((key) {
          assert(json.containsKey(key), 'Required key "UpdateFFmpegSystemConfigDto[$key]" is missing from JSON.');
          assert(json[key] != null, 'Required key "UpdateFFmpegSystemConfigDto[$key]" has a null value in JSON.');
        });
        return true;
      }());

      return UpdateFFmpegSystemConfigDto(
        crf: mapValueOfType<String>(json, r'crf'),
        preset: mapValueOfType<String>(json, r'preset'),
        targetVideoCodec: mapValueOfType<String>(json, r'targetVideoCodec'),
        targetAudioCodec: mapValueOfType<String>(json, r'targetAudioCodec'),
        targetScaling: mapValueOfType<String>(json, r'targetScaling'),
      );
    }
    return null;
  }

  static List<UpdateFFmpegSystemConfigDto>? listFromJson(dynamic json, {bool growable = false,}) {
    final result = <UpdateFFmpegSystemConfigDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = UpdateFFmpegSystemConfigDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, UpdateFFmpegSystemConfigDto> mapFromJson(dynamic json) {
    final map = <String, UpdateFFmpegSystemConfigDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = UpdateFFmpegSystemConfigDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of UpdateFFmpegSystemConfigDto-objects as value to a dart map
  static Map<String, List<UpdateFFmpegSystemConfigDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<UpdateFFmpegSystemConfigDto>>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = UpdateFFmpegSystemConfigDto.listFromJson(entry.value, growable: growable,);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
  };
}

