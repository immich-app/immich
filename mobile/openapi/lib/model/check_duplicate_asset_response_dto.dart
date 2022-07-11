//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.12

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class CheckDuplicateAssetResponseDto {
  /// Returns a new [CheckDuplicateAssetResponseDto] instance.
  CheckDuplicateAssetResponseDto({
    required this.isExist,
  });

  bool isExist;

  @override
  bool operator ==(Object other) => identical(this, other) || other is CheckDuplicateAssetResponseDto &&
     other.isExist == isExist;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (isExist.hashCode);

  @override
  String toString() => 'CheckDuplicateAssetResponseDto[isExist=$isExist]';

  Map<String, dynamic> toJson() {
    final _json = <String, dynamic>{};
      _json[r'isExist'] = isExist;
    return _json;
  }

  /// Returns a new [CheckDuplicateAssetResponseDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static CheckDuplicateAssetResponseDto? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      // Ensure that the map contains the required keys.
      // Note 1: the values aren't checked for validity beyond being non-null.
      // Note 2: this code is stripped in release mode!
      assert(() {
        requiredKeys.forEach((key) {
          assert(json.containsKey(key), 'Required key "CheckDuplicateAssetResponseDto[$key]" is missing from JSON.');
          assert(json[key] != null, 'Required key "CheckDuplicateAssetResponseDto[$key]" has a null value in JSON.');
        });
        return true;
      }());

      return CheckDuplicateAssetResponseDto(
        isExist: mapValueOfType<bool>(json, r'isExist')!,
      );
    }
    return null;
  }

  static List<CheckDuplicateAssetResponseDto>? listFromJson(dynamic json, {bool growable = false,}) {
    final result = <CheckDuplicateAssetResponseDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = CheckDuplicateAssetResponseDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, CheckDuplicateAssetResponseDto> mapFromJson(dynamic json) {
    final map = <String, CheckDuplicateAssetResponseDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = CheckDuplicateAssetResponseDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of CheckDuplicateAssetResponseDto-objects as value to a dart map
  static Map<String, List<CheckDuplicateAssetResponseDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<CheckDuplicateAssetResponseDto>>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = CheckDuplicateAssetResponseDto.listFromJson(entry.value, growable: growable,);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'isExist',
  };
}

