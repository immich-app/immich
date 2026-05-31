// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

final class NotificationCreateDto {
  const NotificationCreateDto({
    this.data = const Optional.absent(),
    this.description = const Optional.absent(),
    this.level = const Optional.absent(),
    this.readAt = const Optional.absent(),
    required this.title,
    this.type = const Optional.absent(),
    required this.userId,
  });

  /// Additional notification data
  final Optional<Map<String, dynamic>> data;

  /// Notification description
  final Optional<String?> description;

  final Optional<NotificationLevel> level;

  /// Date when notification was read
  final Optional<DateTime?> readAt;

  /// Notification title
  final String title;

  final Optional<NotificationType> type;

  /// User ID to send notification to
  final String userId;

  static NotificationCreateDto? fromJson(dynamic value) {
    ApiCompat.upgrade<NotificationCreateDto>(value);
    if (value is! Map) return null;
    final json = value.cast<String, dynamic>();
    return .new(
      data: json.containsKey(r'data')
          ? Optional.present(((json[r'data'] as Map?)?.cast<String, dynamic>())!)
          : const Optional.absent(),
      description: json.containsKey(r'description')
          ? Optional.present((json[r'description'] as String?))
          : const Optional.absent(),
      level: json.containsKey(r'level')
          ? Optional.present((NotificationLevel.fromJson(json[r'level']))!)
          : const Optional.absent(),
      readAt: json.containsKey(r'readAt')
          ? Optional.present((json[r'readAt'] == null ? null : DateTime.parse(json[r'readAt'] as String)))
          : const Optional.absent(),
      title: json[r'title'] as String,
      type: json.containsKey(r'type')
          ? Optional.present((NotificationType.fromJson(json[r'type']))!)
          : const Optional.absent(),
      userId: json[r'userId'] as String,
    );
  }

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    if (data case Present(:final value)) {
      json[r'data'] = value;
    }
    if (description case Present(:final value)) {
      json[r'description'] = value;
    }
    if (level case Present(:final value)) {
      json[r'level'] = value.toJson();
    }
    if (readAt case Present(:final value)) {
      json[r'readAt'] = value?.toUtc().toIso8601String();
    }
    json[r'title'] = title;
    if (type case Present(:final value)) {
      json[r'type'] = value.toJson();
    }
    json[r'userId'] = userId;
    return json;
  }

  NotificationCreateDto copyWith({
    Optional<Map<String, dynamic>>? data,
    Optional<String?>? description,
    Optional<NotificationLevel>? level,
    Optional<DateTime?>? readAt,
    String? title,
    Optional<NotificationType>? type,
    String? userId,
  }) {
    return .new(
      data: data ?? this.data,
      description: description ?? this.description,
      level: level ?? this.level,
      readAt: readAt ?? this.readAt,
      title: title ?? this.title,
      type: type ?? this.type,
      userId: userId ?? this.userId,
    );
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other is NotificationCreateDto &&
            data == other.data &&
            description == other.description &&
            level == other.level &&
            readAt == other.readAt &&
            title == other.title &&
            type == other.type &&
            userId == other.userId);
  }

  @override
  int get hashCode {
    return Object.hashAll([data, description, level, readAt, title, type, userId]);
  }

  @override
  String toString() =>
      'NotificationCreateDto(data=$data, description=$description, level=$level, readAt=$readAt, title=$title, type=$type, userId=$userId)';
}
