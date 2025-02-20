//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class DuplicateInfoResponseDto {
  /// Returns a new [DuplicateInfoResponseDto] instance.
  DuplicateInfoResponseDto({
    required this.duplicateId,
    required this.exampleAsset,
  });

  String duplicateId;

  AssetResponseDto exampleAsset;

  @override
  bool operator ==(Object other) => identical(this, other) || other is DuplicateInfoResponseDto &&
    other.duplicateId == duplicateId &&
    other.exampleAsset == exampleAsset;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (duplicateId.hashCode) +
    (exampleAsset.hashCode);

  @override
  String toString() => 'DuplicateInfoResponseDto[duplicateId=$duplicateId, exampleAsset=$exampleAsset]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'duplicateId'] = this.duplicateId;
      json[r'exampleAsset'] = this.exampleAsset;
    return json;
  }

  /// Returns a new [DuplicateInfoResponseDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static DuplicateInfoResponseDto? fromJson(dynamic value) {
    upgradeDto(value, "DuplicateInfoResponseDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return DuplicateInfoResponseDto(
        duplicateId: mapValueOfType<String>(json, r'duplicateId')!,
        exampleAsset: AssetResponseDto.fromJson(json[r'exampleAsset'])!,
      );
    }
    return null;
  }

  static List<DuplicateInfoResponseDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <DuplicateInfoResponseDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = DuplicateInfoResponseDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, DuplicateInfoResponseDto> mapFromJson(dynamic json) {
    final map = <String, DuplicateInfoResponseDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = DuplicateInfoResponseDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of DuplicateInfoResponseDto-objects as value to a dart map
  static Map<String, List<DuplicateInfoResponseDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<DuplicateInfoResponseDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = DuplicateInfoResponseDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'duplicateId',
    'exampleAsset',
  };
}

