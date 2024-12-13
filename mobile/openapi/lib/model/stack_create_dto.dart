//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class StackCreateDto {
  /// Returns a new [StackCreateDto] instance.
  StackCreateDto({
    this.assetIds = const [],
  });

  /// first asset becomes the primary
  List<String> assetIds;

  @override
  bool operator ==(Object other) => identical(this, other) || other is StackCreateDto &&
    _deepEquality.equals(other.assetIds, assetIds);

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (assetIds.hashCode);

  @override
  String toString() => 'StackCreateDto[assetIds=$assetIds]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'assetIds'] = this.assetIds;
    return json;
  }

  /// Returns a new [StackCreateDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static StackCreateDto? fromJson(dynamic value) {
    upgradeDto(value, "StackCreateDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return StackCreateDto(
        assetIds: json[r'assetIds'] is Iterable
            ? (json[r'assetIds'] as Iterable).cast<String>().toList(growable: false)
            : const [],
      );
    }
    return null;
  }

  static List<StackCreateDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <StackCreateDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = StackCreateDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, StackCreateDto> mapFromJson(dynamic json) {
    final map = <String, StackCreateDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = StackCreateDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of StackCreateDto-objects as value to a dart map
  static Map<String, List<StackCreateDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<StackCreateDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = StackCreateDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'assetIds',
  };
}

