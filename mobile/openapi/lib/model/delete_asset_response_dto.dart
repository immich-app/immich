//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.12

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class DeleteAssetResponseDto {
  /// Returns a new [DeleteAssetResponseDto] instance.
  DeleteAssetResponseDto({
    required this.status,
    required this.id,
  });

  DeleteAssetStatus status;

  String id;

  @override
  bool operator ==(Object other) => identical(this, other) || other is DeleteAssetResponseDto &&
     other.status == status &&
     other.id == id;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (status.hashCode) +
    (id.hashCode);

  @override
  String toString() => 'DeleteAssetResponseDto[status=$status, id=$id]';

  Map<String, dynamic> toJson() {
    final _json = <String, dynamic>{};
      _json[r'status'] = status;
      _json[r'id'] = id;
    return _json;
  }

  /// Returns a new [DeleteAssetResponseDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static DeleteAssetResponseDto? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      // Ensure that the map contains the required keys.
      // Note 1: the values aren't checked for validity beyond being non-null.
      // Note 2: this code is stripped in release mode!
      assert(() {
        requiredKeys.forEach((key) {
          assert(json.containsKey(key), 'Required key "DeleteAssetResponseDto[$key]" is missing from JSON.');
          assert(json[key] != null, 'Required key "DeleteAssetResponseDto[$key]" has a null value in JSON.');
        });
        return true;
      }());

      return DeleteAssetResponseDto(
        status: DeleteAssetStatus.fromJson(json[r'status'])!,
        id: mapValueOfType<String>(json, r'id')!,
      );
    }
    return null;
  }

  static List<DeleteAssetResponseDto>? listFromJson(dynamic json, {bool growable = false,}) {
    final result = <DeleteAssetResponseDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = DeleteAssetResponseDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, DeleteAssetResponseDto> mapFromJson(dynamic json) {
    final map = <String, DeleteAssetResponseDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = DeleteAssetResponseDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of DeleteAssetResponseDto-objects as value to a dart map
  static Map<String, List<DeleteAssetResponseDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<DeleteAssetResponseDto>>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = DeleteAssetResponseDto.listFromJson(entry.value, growable: growable,);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'status',
    'id',
  };
}

