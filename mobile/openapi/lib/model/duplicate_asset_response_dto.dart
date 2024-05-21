//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class DuplicateAssetResponseDto {
  /// Returns a new [DuplicateAssetResponseDto] instance.
  DuplicateAssetResponseDto({
    required this.duplicateId,
    required this.status,
  });

  String duplicateId;

  AssetMediaStatus status;

  @override
  bool operator ==(Object other) => identical(this, other) || other is DuplicateAssetResponseDto &&
    other.duplicateId == duplicateId &&
    other.status == status;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (duplicateId.hashCode) +
    (status.hashCode);

  @override
  String toString() => 'DuplicateAssetResponseDto[duplicateId=$duplicateId, status=$status]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'duplicateId'] = this.duplicateId;
      json[r'status'] = this.status;
    return json;
  }

  /// Returns a new [DuplicateAssetResponseDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static DuplicateAssetResponseDto? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return DuplicateAssetResponseDto(
        duplicateId: mapValueOfType<String>(json, r'duplicateId')!,
        status: AssetMediaStatus.fromJson(json[r'status'])!,
      );
    }
    return null;
  }

  static List<DuplicateAssetResponseDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <DuplicateAssetResponseDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = DuplicateAssetResponseDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, DuplicateAssetResponseDto> mapFromJson(dynamic json) {
    final map = <String, DuplicateAssetResponseDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = DuplicateAssetResponseDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of DuplicateAssetResponseDto-objects as value to a dart map
  static Map<String, List<DuplicateAssetResponseDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<DuplicateAssetResponseDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = DuplicateAssetResponseDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'duplicateId',
    'status',
  };
}

