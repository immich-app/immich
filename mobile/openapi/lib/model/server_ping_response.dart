//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class ServerPingResponse {
  /// Returns a new [ServerPingResponse] instance.
  ServerPingResponse({
    required this.res,
  });

  String res;

  @override
  bool operator ==(Object other) => identical(this, other) || other is ServerPingResponse &&
    other.res == res;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (res.hashCode);

  @override
  String toString() => 'ServerPingResponse[res=$res]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'res'] = this.res;
    return json;
  }

  /// Returns a new [ServerPingResponse] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static ServerPingResponse? fromJson(dynamic value) {
    upgradeDto(value, "ServerPingResponse");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return ServerPingResponse(
        res: mapValueOfType<String>(json, r'res')!,
      );
    }
    return null;
  }

  static List<ServerPingResponse> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <ServerPingResponse>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = ServerPingResponse.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, ServerPingResponse> mapFromJson(dynamic json) {
    final map = <String, ServerPingResponse>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = ServerPingResponse.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of ServerPingResponse-objects as value to a dart map
  static Map<String, List<ServerPingResponse>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<ServerPingResponse>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = ServerPingResponse.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'res',
  };
}

