// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

final class NotificationDto {
  const NotificationDto({
    required this.createdAt,
    this.data,
    this.description,
    required this.id,
    required this.level,
    this.readAt,
    required this.title,
    required this.type,
  });

  /// Creation date
  final DateTime createdAt;

  /// Additional notification data
  final Map<String, dynamic>? data;

  /// Notification description
  final String? description;

  /// Notification ID
  final String id;

  final NotificationLevel level;

  /// Date when notification was read
  final DateTime? readAt;

  /// Notification title
  final String title;

  final NotificationType type;

  static const _undefined = Object();

  static NotificationDto? fromJson(dynamic value) {
    ApiCompat.upgrade<NotificationDto>(value);
    if (value is! Map) return null;
    final json = value.cast<String, dynamic>();
    return .new(
      createdAt: DateTime.parse(json[r'createdAt'] as String),
      data: (json[r'data'] as Map?)?.cast<String, dynamic>(),
      description: (json[r'description'] as String?),
      id: json[r'id'] as String,
      level: (NotificationLevel.fromJson(json[r'level']))!,
      readAt: (json[r'readAt'] == null ? null : DateTime.parse(json[r'readAt'] as String)),
      title: json[r'title'] as String,
      type: (NotificationType.fromJson(json[r'type']))!,
    );
  }

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    json[r'createdAt'] = createdAt.toUtc().toIso8601String();
    if (data != null) {
      json[r'data'] = data!;
    }
    if (description != null) {
      json[r'description'] = description!;
    }
    json[r'id'] = id;
    json[r'level'] = level.toJson();
    if (readAt != null) {
      json[r'readAt'] = readAt!.toUtc().toIso8601String();
    }
    json[r'title'] = title;
    json[r'type'] = type.toJson();
    return json;
  }

  NotificationDto copyWith({
    DateTime? createdAt,
    Object? data = _undefined,
    Object? description = _undefined,
    String? id,
    NotificationLevel? level,
    Object? readAt = _undefined,
    String? title,
    NotificationType? type,
  }) {
    return .new(
      createdAt: createdAt ?? this.createdAt,
      data: identical(data, _undefined) ? this.data : data as Map<String, dynamic>?,
      description: identical(description, _undefined) ? this.description : description as String?,
      id: id ?? this.id,
      level: level ?? this.level,
      readAt: identical(readAt, _undefined) ? this.readAt : readAt as DateTime?,
      title: title ?? this.title,
      type: type ?? this.type,
    );
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other is NotificationDto &&
            createdAt == other.createdAt &&
            const DeepCollectionEquality().equals(data, other.data) &&
            description == other.description &&
            id == other.id &&
            level == other.level &&
            readAt == other.readAt &&
            title == other.title &&
            type == other.type);
  }

  @override
  int get hashCode {
    return Object.hashAll([
      createdAt,
      const DeepCollectionEquality().hash(data),
      description,
      id,
      level,
      readAt,
      title,
      type,
    ]);
  }

  @override
  String toString() =>
      'NotificationDto(createdAt=$createdAt, data=$data, description=$description, id=$id, level=$level, readAt=$readAt, title=$title, type=$type)';
}
