//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class EmailNotificationsResponse {
  /// Returns a new [EmailNotificationsResponse] instance.
  EmailNotificationsResponse({
    required this.albumInvite,
    required this.albumUpdate,
    required this.enabled,
  });

  bool albumInvite;

  bool albumUpdate;

  bool enabled;

  @override
  bool operator ==(Object other) => identical(this, other) || other is EmailNotificationsResponse &&
    other.albumInvite == albumInvite &&
    other.albumUpdate == albumUpdate &&
    other.enabled == enabled;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (albumInvite.hashCode) +
    (albumUpdate.hashCode) +
    (enabled.hashCode);

  @override
  String toString() => 'EmailNotificationsResponse[albumInvite=$albumInvite, albumUpdate=$albumUpdate, enabled=$enabled]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'albumInvite'] = this.albumInvite;
      json[r'albumUpdate'] = this.albumUpdate;
      json[r'enabled'] = this.enabled;
    return json;
  }

  /// Returns a new [EmailNotificationsResponse] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static EmailNotificationsResponse? fromJson(dynamic value) {
    upgradeDto(value, "EmailNotificationsResponse");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return EmailNotificationsResponse(
        albumInvite: mapValueOfType<bool>(json, r'albumInvite')!,
        albumUpdate: mapValueOfType<bool>(json, r'albumUpdate')!,
        enabled: mapValueOfType<bool>(json, r'enabled')!,
      );
    }
    return null;
  }

  static List<EmailNotificationsResponse> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <EmailNotificationsResponse>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = EmailNotificationsResponse.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, EmailNotificationsResponse> mapFromJson(dynamic json) {
    final map = <String, EmailNotificationsResponse>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = EmailNotificationsResponse.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of EmailNotificationsResponse-objects as value to a dart map
  static Map<String, List<EmailNotificationsResponse>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<EmailNotificationsResponse>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = EmailNotificationsResponse.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'albumInvite',
    'albumUpdate',
    'enabled',
  };
}

