//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class AvatarResponse {
  /// Returns a new [AvatarResponse] instance.
  AvatarResponse({
    required this.color,
  });

  UserAvatarColor color;

  @override
  bool operator ==(Object other) => identical(this, other) || other is AvatarResponse &&
    other.color == color;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (color.hashCode);

  @override
  String toString() => 'AvatarResponse[color=$color]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'color'] = this.color;
    return json;
  }

  /// Returns a new [AvatarResponse] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static AvatarResponse? fromJson(dynamic value) {
    upgradeDto(value, "AvatarResponse");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return AvatarResponse(
        color: UserAvatarColor.fromJson(json[r'color'])!,
      );
    }
    return null;
  }

  static List<AvatarResponse> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <AvatarResponse>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = AvatarResponse.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, AvatarResponse> mapFromJson(dynamic json) {
    final map = <String, AvatarResponse>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = AvatarResponse.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of AvatarResponse-objects as value to a dart map
  static Map<String, List<AvatarResponse>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<AvatarResponse>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = AvatarResponse.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'color',
  };
}

