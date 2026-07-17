//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class EmailNotificationsUpdate {
  /// Returns a new [EmailNotificationsUpdate] instance.
  EmailNotificationsUpdate({
    this.albumInvite = const Optional.absent(),
    this.albumUpdate = const Optional.absent(),
    this.enabled = const Optional.absent(),
  });

  /// Whether to receive email notifications for album invites
  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  Optional<bool?> albumInvite;

  /// Whether to receive email notifications for album updates
  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  Optional<bool?> albumUpdate;

  /// Whether email notifications are enabled
  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  Optional<bool?> enabled;

  @override
  bool operator ==(Object other) => identical(this, other) || other is EmailNotificationsUpdate &&
    other.albumInvite == albumInvite &&
    other.albumUpdate == albumUpdate &&
    other.enabled == enabled;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (albumInvite == null ? 0 : albumInvite!.hashCode) +
    (albumUpdate == null ? 0 : albumUpdate!.hashCode) +
    (enabled == null ? 0 : enabled!.hashCode);

  @override
  String toString() => 'EmailNotificationsUpdate[albumInvite=$albumInvite, albumUpdate=$albumUpdate, enabled=$enabled]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    if (this.albumInvite.isPresent) {
      final value = this.albumInvite.value;
      json[r'albumInvite'] = value;
    }
    if (this.albumUpdate.isPresent) {
      final value = this.albumUpdate.value;
      json[r'albumUpdate'] = value;
    }
    if (this.enabled.isPresent) {
      final value = this.enabled.value;
      json[r'enabled'] = value;
    }
    return json;
  }

  /// Returns a new [EmailNotificationsUpdate] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static EmailNotificationsUpdate? fromJson(dynamic value) {
    upgradeDto(value, "EmailNotificationsUpdate");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return EmailNotificationsUpdate(
        albumInvite: json.containsKey(r'albumInvite') ? Optional.present(mapValueOfType<bool>(json, r'albumInvite')) : const Optional.absent(),
        albumUpdate: json.containsKey(r'albumUpdate') ? Optional.present(mapValueOfType<bool>(json, r'albumUpdate')) : const Optional.absent(),
        enabled: json.containsKey(r'enabled') ? Optional.present(mapValueOfType<bool>(json, r'enabled')) : const Optional.absent(),
      );
    }
    return null;
  }

  static List<EmailNotificationsUpdate> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <EmailNotificationsUpdate>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = EmailNotificationsUpdate.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, EmailNotificationsUpdate> mapFromJson(dynamic json) {
    final map = <String, EmailNotificationsUpdate>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = EmailNotificationsUpdate.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of EmailNotificationsUpdate-objects as value to a dart map
  static Map<String, List<EmailNotificationsUpdate>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<EmailNotificationsUpdate>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = EmailNotificationsUpdate.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
  };
}

