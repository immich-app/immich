//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class SystemConfigSmtpTransportDto {
  /// Returns a new [SystemConfigSmtpTransportDto] instance.
  SystemConfigSmtpTransportDto({
    required this.host,
    required this.ignoreCert,
    required this.password,
    required this.port,
    required this.username,
  });

  String host;

  bool ignoreCert;

  String password;

  /// Minimum value: 0
  /// Maximum value: 65535
  num port;

  String username;

  @override
  bool operator ==(Object other) => identical(this, other) || other is SystemConfigSmtpTransportDto &&
    other.host == host &&
    other.ignoreCert == ignoreCert &&
    other.password == password &&
    other.port == port &&
    other.username == username;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (host.hashCode) +
    (ignoreCert.hashCode) +
    (password.hashCode) +
    (port.hashCode) +
    (username.hashCode);

  @override
  String toString() => 'SystemConfigSmtpTransportDto[host=$host, ignoreCert=$ignoreCert, password=$password, port=$port, username=$username]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'host'] = this.host;
      json[r'ignoreCert'] = this.ignoreCert;
      json[r'password'] = this.password;
      json[r'port'] = this.port;
      json[r'username'] = this.username;
    return json;
  }

  /// Returns a new [SystemConfigSmtpTransportDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static SystemConfigSmtpTransportDto? fromJson(dynamic value) {
    upgradeDto(value, "SystemConfigSmtpTransportDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return SystemConfigSmtpTransportDto(
        host: mapValueOfType<String>(json, r'host')!,
        ignoreCert: mapValueOfType<bool>(json, r'ignoreCert')!,
        password: mapValueOfType<String>(json, r'password')!,
        port: num.parse('${json[r'port']}'),
        username: mapValueOfType<String>(json, r'username')!,
      );
    }
    return null;
  }

  static List<SystemConfigSmtpTransportDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <SystemConfigSmtpTransportDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = SystemConfigSmtpTransportDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, SystemConfigSmtpTransportDto> mapFromJson(dynamic json) {
    final map = <String, SystemConfigSmtpTransportDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = SystemConfigSmtpTransportDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of SystemConfigSmtpTransportDto-objects as value to a dart map
  static Map<String, List<SystemConfigSmtpTransportDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<SystemConfigSmtpTransportDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = SystemConfigSmtpTransportDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'host',
    'ignoreCert',
    'password',
    'port',
    'username',
  };
}

