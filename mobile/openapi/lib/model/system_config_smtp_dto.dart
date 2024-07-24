//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class SystemConfigSmtpDto {
  /// Returns a new [SystemConfigSmtpDto] instance.
  SystemConfigSmtpDto({
    required this.enabled,
    required this.from,
    required this.replyTo,
    required this.transport,
  });

  bool enabled;

  String from;

  String replyTo;

  SystemConfigSmtpTransportDto transport;

  @override
  bool operator ==(Object other) => identical(this, other) || other is SystemConfigSmtpDto &&
    other.enabled == enabled &&
    other.from == from &&
    other.replyTo == replyTo &&
    other.transport == transport;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (enabled.hashCode) +
    (from.hashCode) +
    (replyTo.hashCode) +
    (transport.hashCode);

  @override
  String toString() => 'SystemConfigSmtpDto[enabled=$enabled, from=$from, replyTo=$replyTo, transport=$transport]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'enabled'] = this.enabled;
      json[r'from'] = this.from;
      json[r'replyTo'] = this.replyTo;
      json[r'transport'] = this.transport;
    return json;
  }

  /// Returns a new [SystemConfigSmtpDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static SystemConfigSmtpDto? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return SystemConfigSmtpDto(
        enabled: mapValueOfType<bool>(json, r'enabled')!,
        from: mapValueOfType<String>(json, r'from')!,
        replyTo: mapValueOfType<String>(json, r'replyTo')!,
        transport: SystemConfigSmtpTransportDto.fromJson(json[r'transport'])!,
      );
    }
    return null;
  }

  static List<SystemConfigSmtpDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <SystemConfigSmtpDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = SystemConfigSmtpDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, SystemConfigSmtpDto> mapFromJson(dynamic json) {
    final map = <String, SystemConfigSmtpDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = SystemConfigSmtpDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of SystemConfigSmtpDto-objects as value to a dart map
  static Map<String, List<SystemConfigSmtpDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<SystemConfigSmtpDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = SystemConfigSmtpDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'enabled',
    'from',
    'replyTo',
    'transport',
  };
}

