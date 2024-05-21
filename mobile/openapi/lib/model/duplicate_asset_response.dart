//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class DuplicateAssetResponse {
  /// Returns a new [DuplicateAssetResponse] instance.
  DuplicateAssetResponse({
    required this.duplicate,
    this.status = 'duplicate',
  });

  AssetResponseDto duplicate;

  String status;

  @override
  bool operator ==(Object other) => identical(this, other) || other is DuplicateAssetResponse &&
    other.duplicate == duplicate &&
    other.status == status;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (duplicate.hashCode) +
    (status.hashCode);

  @override
  String toString() => 'DuplicateAssetResponse[duplicate=$duplicate, status=$status]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'duplicate'] = this.duplicate;
      json[r'status'] = this.status;
    return json;
  }

  /// Returns a new [DuplicateAssetResponse] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static DuplicateAssetResponse? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return DuplicateAssetResponse(
        duplicate: AssetResponseDto.fromJson(json[r'duplicate'])!,
        status: mapValueOfType<String>(json, r'status')!,
      );
    }
    return null;
  }

  static List<DuplicateAssetResponse> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <DuplicateAssetResponse>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = DuplicateAssetResponse.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, DuplicateAssetResponse> mapFromJson(dynamic json) {
    final map = <String, DuplicateAssetResponse>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = DuplicateAssetResponse.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of DuplicateAssetResponse-objects as value to a dart map
  static Map<String, List<DuplicateAssetResponse>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<DuplicateAssetResponse>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = DuplicateAssetResponse.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'duplicate',
    'status',
  };
}

