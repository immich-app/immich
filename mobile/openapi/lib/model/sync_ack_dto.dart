//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class SyncAckDto {
  /// Returns a new [SyncAckDto] instance.
  SyncAckDto({
    required this.ack,
    required this.type,
  });

  /// Acknowledgment ID
  String ack;

  SyncEntityType type;

  @override
  bool operator ==(Object other) => identical(this, other) || other is SyncAckDto &&
    other.ack == ack &&
    other.type == type;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (ack.hashCode) +
    (type.hashCode);

  @override
  String toString() => 'SyncAckDto[ack=$ack, type=$type]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'ack'] = this.ack;
      json[r'type'] = this.type;
    return json;
  }

  /// Returns a new [SyncAckDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static SyncAckDto? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      // Ensure that the map contains the required keys.
      // Note 1: the values aren't checked for validity beyond being non-null.
      // Note 2: this code is stripped in release mode!
      assert(() {
        assert(json.containsKey(r'ack'), 'Required key "SyncAckDto[ack]" is missing from JSON.');
        assert(json[r'ack'] != null, 'Required key "SyncAckDto[ack]" has a null value in JSON.');
        assert(json.containsKey(r'type'), 'Required key "SyncAckDto[type]" is missing from JSON.');
        assert(json[r'type'] != null, 'Required key "SyncAckDto[type]" has a null value in JSON.');
        return true;
      }());

      return SyncAckDto(
        ack: mapValueOfType<String>(json, r'ack')!,
        type: SyncEntityType.fromJson(json[r'type'])!,
      );
    }
    return null;
  }

  static List<SyncAckDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <SyncAckDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = SyncAckDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, SyncAckDto> mapFromJson(dynamic json) {
    final map = <String, SyncAckDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = SyncAckDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of SyncAckDto-objects as value to a dart map
  static Map<String, List<SyncAckDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<SyncAckDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = SyncAckDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'ack',
    'type',
  };
}

