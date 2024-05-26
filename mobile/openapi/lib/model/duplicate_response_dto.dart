//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class DuplicateResponseDto {
  /// Returns a new [DuplicateResponseDto] instance.
  DuplicateResponseDto({
    this.assets = const [],
    required this.duplicateId,
  });

  List<AssetResponseDto> assets;

  String duplicateId;

  @override
  bool operator ==(Object other) => identical(this, other) || other is DuplicateResponseDto &&
    _deepEquality.equals(other.assets, assets) &&
    other.duplicateId == duplicateId;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (assets.hashCode) +
    (duplicateId.hashCode);

  @override
  String toString() => 'DuplicateResponseDto[assets=$assets, duplicateId=$duplicateId]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'assets'] = this.assets;
      json[r'duplicateId'] = this.duplicateId;
    return json;
  }

  /// Returns a new [DuplicateResponseDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static DuplicateResponseDto? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return DuplicateResponseDto(
        assets: AssetResponseDto.listFromJson(json[r'assets']),
        duplicateId: mapValueOfType<String>(json, r'duplicateId')!,
      );
    }
    return null;
  }

  static List<DuplicateResponseDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <DuplicateResponseDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = DuplicateResponseDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, DuplicateResponseDto> mapFromJson(dynamic json) {
    final map = <String, DuplicateResponseDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = DuplicateResponseDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of DuplicateResponseDto-objects as value to a dart map
  static Map<String, List<DuplicateResponseDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<DuplicateResponseDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = DuplicateResponseDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'assets',
    'duplicateId',
  };
}

