//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.12

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class SystemConfigProxyDto {
  /// Returns a new [SystemConfigProxyDto] instance.
  SystemConfigProxyDto({
    required this.enabled,
    required this.hostname,
    required this.port,
    required this.protocol,
  });

  bool enabled;

  String hostname;

  String port;

  ProxyProtocol protocol;

  @override
  bool operator ==(Object other) => identical(this, other) || other is SystemConfigProxyDto &&
     other.enabled == enabled &&
     other.hostname == hostname &&
     other.port == port &&
     other.protocol == protocol;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (enabled.hashCode) +
    (hostname.hashCode) +
    (port.hashCode) +
    (protocol.hashCode);

  @override
  String toString() => 'SystemConfigProxyDto[enabled=$enabled, hostname=$hostname, port=$port, protocol=$protocol]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'enabled'] = this.enabled;
      json[r'hostname'] = this.hostname;
      json[r'port'] = this.port;
      json[r'protocol'] = this.protocol;
    return json;
  }

  /// Returns a new [SystemConfigProxyDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static SystemConfigProxyDto? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return SystemConfigProxyDto(
        enabled: mapValueOfType<bool>(json, r'enabled')!,
        hostname: mapValueOfType<String>(json, r'hostname')!,
        port: mapValueOfType<String>(json, r'port')!,
        protocol: ProxyProtocol.fromJson(json[r'protocol'])!,
      );
    }
    return null;
  }

  static List<SystemConfigProxyDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <SystemConfigProxyDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = SystemConfigProxyDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, SystemConfigProxyDto> mapFromJson(dynamic json) {
    final map = <String, SystemConfigProxyDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = SystemConfigProxyDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of SystemConfigProxyDto-objects as value to a dart map
  static Map<String, List<SystemConfigProxyDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<SystemConfigProxyDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = SystemConfigProxyDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'enabled',
    'hostname',
    'port',
    'protocol',
  };
}

