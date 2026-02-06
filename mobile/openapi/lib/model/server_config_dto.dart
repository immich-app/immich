//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class ServerConfigDto {
  /// Returns a new [ServerConfigDto] instance.
  ServerConfigDto({
    required this.loginPageMessage,
    required this.userDeleteDelay,
    required this.isInitialized,
  });

  /// Login page message
  String loginPageMessage;

  /// Delay in days before deleted users are permanently removed
  int userDeleteDelay;

  /// Whether the server has been initialized
  bool isInitialized;

  @override
  bool operator ==(Object other) => identical(this, other) || other is ServerConfigDto &&
    other.loginPageMessage == loginPageMessage &&
    other.userDeleteDelay == userDeleteDelay &&
    other.isInitialized == isInitialized;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (loginPageMessage.hashCode) +
    (userDeleteDelay.hashCode) +
    (isInitialized.hashCode);

  @override
  String toString() => 'ServerConfigDto[loginPageMessage=$loginPageMessage, userDeleteDelay=$userDeleteDelay, isInitialized=$isInitialized]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'loginPageMessage'] = this.loginPageMessage;
      json[r'userDeleteDelay'] = this.userDeleteDelay;
      json[r'isInitialized'] = this.isInitialized;
    return json;
  }

  /// Returns a new [ServerConfigDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static ServerConfigDto? fromJson(dynamic value) {
    upgradeDto(value, "ServerConfigDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return ServerConfigDto(
        loginPageMessage: mapValueOfType<String>(json, r'loginPageMessage')!,
        userDeleteDelay: mapValueOfType<int>(json, r'userDeleteDelay')!,
        isInitialized: mapValueOfType<bool>(json, r'isInitialized')!,
      );
    }
    return null;
  }

  static List<ServerConfigDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <ServerConfigDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = ServerConfigDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, ServerConfigDto> mapFromJson(dynamic json) {
    final map = <String, ServerConfigDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = ServerConfigDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of ServerConfigDto-objects as value to a dart map
  static Map<String, List<ServerConfigDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<ServerConfigDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = ServerConfigDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'loginPageMessage',
    'userDeleteDelay',
    'isInitialized',
  };
}

