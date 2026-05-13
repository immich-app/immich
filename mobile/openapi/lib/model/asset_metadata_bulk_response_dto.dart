//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class AssetMetadataBulkResponseDto {
  /// Returns a new [AssetMetadataBulkResponseDto] instance.
  AssetMetadataBulkResponseDto({
    required this.assetId,
    required this.key,
    required this.updatedAt,
    this.value = const {},
  });

  /// Asset ID
  String assetId;

  /// Metadata key
  String key;

  /// Last update date
  DateTime updatedAt;

  /// Metadata value (object)
  Map<String, Object> value;

  @override
  bool operator ==(Object other) => identical(this, other) || other is AssetMetadataBulkResponseDto &&
    other.assetId == assetId &&
    other.key == key &&
    other.updatedAt == updatedAt &&
    _deepEquality.equals(other.value, value);

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (assetId.hashCode) +
    (key.hashCode) +
    (updatedAt.hashCode) +
    (value.hashCode);

  @override
  String toString() => 'AssetMetadataBulkResponseDto[assetId=$assetId, key=$key, updatedAt=$updatedAt, value=$value]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'assetId'] = this.assetId;
      json[r'key'] = this.key;
      json[r'updatedAt'] = _isEpochMarker(r'/^(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))T(?:(?:[01]\\d|2[0-3]):[0-5]\\d(?::[0-5]\\d(?:\\.\\d+)?)?(?:Z))$/')
        ? this.updatedAt.millisecondsSinceEpoch
        : this.updatedAt.toUtc().toIso8601String();
      json[r'value'] = this.value;
    return json;
  }

  /// Returns a new [AssetMetadataBulkResponseDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static AssetMetadataBulkResponseDto? fromJson(dynamic value) {
    upgradeDto(value, "AssetMetadataBulkResponseDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return AssetMetadataBulkResponseDto(
        assetId: mapValueOfType<String>(json, r'assetId')!,
        key: mapValueOfType<String>(json, r'key')!,
        updatedAt: mapDateTime(json, r'updatedAt', r'/^(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))T(?:(?:[01]\\d|2[0-3]):[0-5]\\d(?::[0-5]\\d(?:\\.\\d+)?)?(?:Z))$/')!,
        value: mapCastOfType<String, Object>(json, r'value')!,
      );
    }
    return null;
  }

  static List<AssetMetadataBulkResponseDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <AssetMetadataBulkResponseDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = AssetMetadataBulkResponseDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, AssetMetadataBulkResponseDto> mapFromJson(dynamic json) {
    final map = <String, AssetMetadataBulkResponseDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = AssetMetadataBulkResponseDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of AssetMetadataBulkResponseDto-objects as value to a dart map
  static Map<String, List<AssetMetadataBulkResponseDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<AssetMetadataBulkResponseDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = AssetMetadataBulkResponseDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'assetId',
    'key',
    'updatedAt',
    'value',
  };
}

