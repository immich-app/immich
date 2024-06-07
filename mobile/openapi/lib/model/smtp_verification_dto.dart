//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class SmtpVerificationDto {
  /// Returns a new [SmtpVerificationDto] instance.
  SmtpVerificationDto({
    required this.from,
    required this.host,
    this.ignoreCert,
    this.password,
    this.port,
    this.username,
  });

  String from;

  String host;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  bool? ignoreCert;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  String? password;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  num? port;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  String? username;

  @override
  bool operator ==(Object other) => identical(this, other) || other is SmtpVerificationDto &&
    other.from == from &&
    other.host == host &&
    other.ignoreCert == ignoreCert &&
    other.password == password &&
    other.port == port &&
    other.username == username;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (from.hashCode) +
    (host.hashCode) +
    (ignoreCert == null ? 0 : ignoreCert!.hashCode) +
    (password == null ? 0 : password!.hashCode) +
    (port == null ? 0 : port!.hashCode) +
    (username == null ? 0 : username!.hashCode);

  @override
  String toString() => 'SmtpVerificationDto[from=$from, host=$host, ignoreCert=$ignoreCert, password=$password, port=$port, username=$username]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'from'] = this.from;
      json[r'host'] = this.host;
    if (this.ignoreCert != null) {
      json[r'ignoreCert'] = this.ignoreCert;
    } else {
    //  json[r'ignoreCert'] = null;
    }
    if (this.password != null) {
      json[r'password'] = this.password;
    } else {
    //  json[r'password'] = null;
    }
    if (this.port != null) {
      json[r'port'] = this.port;
    } else {
    //  json[r'port'] = null;
    }
    if (this.username != null) {
      json[r'username'] = this.username;
    } else {
    //  json[r'username'] = null;
    }
    return json;
  }

  /// Returns a new [SmtpVerificationDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static SmtpVerificationDto? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return SmtpVerificationDto(
        from: mapValueOfType<String>(json, r'from')!,
        host: mapValueOfType<String>(json, r'host')!,
        ignoreCert: mapValueOfType<bool>(json, r'ignoreCert'),
        password: mapValueOfType<String>(json, r'password'),
        port: num.parse('${json[r'port']}'),
        username: mapValueOfType<String>(json, r'username'),
      );
    }
    return null;
  }

  static List<SmtpVerificationDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <SmtpVerificationDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = SmtpVerificationDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, SmtpVerificationDto> mapFromJson(dynamic json) {
    final map = <String, SmtpVerificationDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = SmtpVerificationDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of SmtpVerificationDto-objects as value to a dart map
  static Map<String, List<SmtpVerificationDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<SmtpVerificationDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = SmtpVerificationDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'from',
    'host',
  };
}

