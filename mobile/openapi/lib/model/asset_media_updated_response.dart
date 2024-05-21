//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class AssetMediaUpdatedResponse {
  /// Returns a new [AssetMediaUpdatedResponse] instance.
  AssetMediaUpdatedResponse({
    required this.asset,
    required this.backup,
    this.status = 'updated',
  });

  AssetResponseDto asset;

  AssetResponseDto backup;

  String status;

  @override
  bool operator ==(Object other) => identical(this, other) || other is AssetMediaUpdatedResponse &&
    other.asset == asset &&
    other.backup == backup &&
    other.status == status;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (asset.hashCode) +
    (backup.hashCode) +
    (status.hashCode);

  @override
  String toString() => 'AssetMediaUpdatedResponse[asset=$asset, backup=$backup, status=$status]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'asset'] = this.asset;
      json[r'backup'] = this.backup;
      json[r'status'] = this.status;
    return json;
  }

  /// Returns a new [AssetMediaUpdatedResponse] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static AssetMediaUpdatedResponse? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return AssetMediaUpdatedResponse(
        asset: AssetResponseDto.fromJson(json[r'asset'])!,
        backup: AssetResponseDto.fromJson(json[r'backup'])!,
        status: mapValueOfType<String>(json, r'status')!,
      );
    }
    return null;
  }

  static List<AssetMediaUpdatedResponse> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <AssetMediaUpdatedResponse>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = AssetMediaUpdatedResponse.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, AssetMediaUpdatedResponse> mapFromJson(dynamic json) {
    final map = <String, AssetMediaUpdatedResponse>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = AssetMediaUpdatedResponse.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of AssetMediaUpdatedResponse-objects as value to a dart map
  static Map<String, List<AssetMediaUpdatedResponse>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<AssetMediaUpdatedResponse>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = AssetMediaUpdatedResponse.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'asset',
    'backup',
    'status',
  };
}

