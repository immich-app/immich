//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class IntegrationsResponseDto {
  /// Returns a new [IntegrationsResponseDto] instance.
  IntegrationsResponseDto({
    this.immichIntegration = const Optional.absent(),
    this.immichState = const Optional.absent(),
  });

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  Optional<ImmichIntegrationDto?> immichIntegration;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  Optional<ImmichStateDto?> immichState;

  @override
  bool operator ==(Object other) => identical(this, other) || other is IntegrationsResponseDto &&
    other.immichIntegration == immichIntegration &&
    other.immichState == immichState;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (immichIntegration == null ? 0 : immichIntegration!.hashCode) +
    (immichState == null ? 0 : immichState!.hashCode);

  @override
  String toString() => 'IntegrationsResponseDto[immichIntegration=$immichIntegration, immichState=$immichState]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    if (this.immichIntegration.isPresent) {
      final value = this.immichIntegration.value;
      json[r'immichIntegration'] = value;
    }
    if (this.immichState.isPresent) {
      final value = this.immichState.value;
      json[r'immichState'] = value;
    }
    return json;
  }

  /// Returns a new [IntegrationsResponseDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static IntegrationsResponseDto? fromJson(dynamic value) {
    upgradeDto(value, "IntegrationsResponseDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return IntegrationsResponseDto(
        immichIntegration: json.containsKey(r'immichIntegration') ? Optional.present(ImmichIntegrationDto.fromJson(json[r'immichIntegration'])) : const Optional.absent(),
        immichState: json.containsKey(r'immichState') ? Optional.present(ImmichStateDto.fromJson(json[r'immichState'])) : const Optional.absent(),
      );
    }
    return null;
  }

  static List<IntegrationsResponseDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <IntegrationsResponseDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = IntegrationsResponseDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, IntegrationsResponseDto> mapFromJson(dynamic json) {
    final map = <String, IntegrationsResponseDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = IntegrationsResponseDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of IntegrationsResponseDto-objects as value to a dart map
  static Map<String, List<IntegrationsResponseDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<IntegrationsResponseDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = IntegrationsResponseDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
  };
}

