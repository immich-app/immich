// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

final class EmailNotificationsUpdate {
  const EmailNotificationsUpdate({this.albumInvite, this.albumUpdate, this.enabled});

  /// Whether to receive email notifications for album invites
  final bool? albumInvite;

  /// Whether to receive email notifications for album updates
  final bool? albumUpdate;

  /// Whether email notifications are enabled
  final bool? enabled;

  static const _undefined = Object();

  static EmailNotificationsUpdate? fromJson(dynamic value) {
    ApiCompat.upgrade<EmailNotificationsUpdate>(value);
    if (value is! Map) return null;
    final json = value.cast<String, dynamic>();
    return .new(
      albumInvite: (json[r'albumInvite'] as bool?),
      albumUpdate: (json[r'albumUpdate'] as bool?),
      enabled: (json[r'enabled'] as bool?),
    );
  }

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    if (albumInvite != null) {
      json[r'albumInvite'] = albumInvite!;
    }
    if (albumUpdate != null) {
      json[r'albumUpdate'] = albumUpdate!;
    }
    if (enabled != null) {
      json[r'enabled'] = enabled!;
    }
    return json;
  }

  EmailNotificationsUpdate copyWith({
    Object? albumInvite = _undefined,
    Object? albumUpdate = _undefined,
    Object? enabled = _undefined,
  }) {
    return .new(
      albumInvite: identical(albumInvite, _undefined) ? this.albumInvite : albumInvite as bool?,
      albumUpdate: identical(albumUpdate, _undefined) ? this.albumUpdate : albumUpdate as bool?,
      enabled: identical(enabled, _undefined) ? this.enabled : enabled as bool?,
    );
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other is EmailNotificationsUpdate &&
            albumInvite == other.albumInvite &&
            albumUpdate == other.albumUpdate &&
            enabled == other.enabled);
  }

  @override
  int get hashCode {
    return Object.hashAll([albumInvite, albumUpdate, enabled]);
  }

  @override
  String toString() => 'EmailNotificationsUpdate(albumInvite=$albumInvite, albumUpdate=$albumUpdate, enabled=$enabled)';
}
