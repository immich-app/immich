// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

final class EmailNotificationsResponse {
  const EmailNotificationsResponse({required this.albumInvite, required this.albumUpdate, required this.enabled});

  /// Whether to receive email notifications for album invites
  final bool albumInvite;

  /// Whether to receive email notifications for album updates
  final bool albumUpdate;

  /// Whether email notifications are enabled
  final bool enabled;

  static EmailNotificationsResponse? fromJson(dynamic value) {
    ApiCompat.upgrade<EmailNotificationsResponse>(value);
    if (value is! Map) return null;
    final json = value.cast<String, dynamic>();
    return .new(
      albumInvite: json[r'albumInvite'] as bool,
      albumUpdate: json[r'albumUpdate'] as bool,
      enabled: json[r'enabled'] as bool,
    );
  }

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    json[r'albumInvite'] = albumInvite;
    json[r'albumUpdate'] = albumUpdate;
    json[r'enabled'] = enabled;
    return json;
  }

  EmailNotificationsResponse copyWith({bool? albumInvite, bool? albumUpdate, bool? enabled}) {
    return .new(
      albumInvite: albumInvite ?? this.albumInvite,
      albumUpdate: albumUpdate ?? this.albumUpdate,
      enabled: enabled ?? this.enabled,
    );
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other is EmailNotificationsResponse &&
            albumInvite == other.albumInvite &&
            albumUpdate == other.albumUpdate &&
            enabled == other.enabled);
  }

  @override
  int get hashCode {
    return Object.hashAll([albumInvite, albumUpdate, enabled]);
  }

  @override
  String toString() =>
      'EmailNotificationsResponse(albumInvite=$albumInvite, albumUpdate=$albumUpdate, enabled=$enabled)';
}
