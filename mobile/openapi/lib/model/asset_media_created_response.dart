//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class AssetMediaCreatedResponse {
  /// Returns a new [AssetMediaCreatedResponse] instance.
  AssetMediaCreatedResponse({
    required this.asset,
    this.status = 'created',
  });

  AssetResponseDto asset;

  String status;

  @override
  bool operator ==(Object other) => identical(this, other) || other is AssetMediaCreatedResponse &&
    other.asset == asset &&
    other.status == status;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (asset.hashCode) +
    (status.hashCode);

  @override
  String toString() => 'AssetMediaCreatedResponse[asset=$asset, status=$status]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'asset'] = this.asset;
      json[r'status'] = this.status;
    return json;
  }

  /// Returns a new [AssetMediaCreatedResponse] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static AssetMediaCreatedResponse? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return AssetMediaCreatedResponse(
        asset: AssetResponseDto.fromJson(json[r'asset'])!,
        status: mapValueOfType<String>(json, r'status')!,
      );
    }
    return null;
  }

  static List<AssetMediaCreatedResponse> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <AssetMediaCreatedResponse>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = AssetMediaCreatedResponse.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, AssetMediaCreatedResponse> mapFromJson(dynamic json) {
    final map = <String, AssetMediaCreatedResponse>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = AssetMediaCreatedResponse.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of AssetMediaCreatedResponse-objects as value to a dart map
  static Map<String, List<AssetMediaCreatedResponse>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<AssetMediaCreatedResponse>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = AssetMediaCreatedResponse.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'asset',
    'status',
  };
}

