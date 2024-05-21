//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class AssetMediaUpdateResponseDto {
  /// Returns a new [AssetMediaUpdateResponseDto] instance.
  AssetMediaUpdateResponseDto({
    required this.assetId,
    required this.backupId,
    required this.status,
  });

  String assetId;

  String backupId;

  AssetMediaStatus status;

  @override
  bool operator ==(Object other) => identical(this, other) || other is AssetMediaUpdateResponseDto &&
    other.assetId == assetId &&
    other.backupId == backupId &&
    other.status == status;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (assetId.hashCode) +
    (backupId.hashCode) +
    (status.hashCode);

  @override
  String toString() => 'AssetMediaUpdateResponseDto[assetId=$assetId, backupId=$backupId, status=$status]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'assetId'] = this.assetId;
      json[r'backupId'] = this.backupId;
      json[r'status'] = this.status;
    return json;
  }

  /// Returns a new [AssetMediaUpdateResponseDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static AssetMediaUpdateResponseDto? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return AssetMediaUpdateResponseDto(
        assetId: mapValueOfType<String>(json, r'assetId')!,
        backupId: mapValueOfType<String>(json, r'backupId')!,
        status: AssetMediaStatus.fromJson(json[r'status'])!,
      );
    }
    return null;
  }

  static List<AssetMediaUpdateResponseDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <AssetMediaUpdateResponseDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = AssetMediaUpdateResponseDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, AssetMediaUpdateResponseDto> mapFromJson(dynamic json) {
    final map = <String, AssetMediaUpdateResponseDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = AssetMediaUpdateResponseDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of AssetMediaUpdateResponseDto-objects as value to a dart map
  static Map<String, List<AssetMediaUpdateResponseDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<AssetMediaUpdateResponseDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = AssetMediaUpdateResponseDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'assetId',
    'backupId',
    'status',
  };
}

