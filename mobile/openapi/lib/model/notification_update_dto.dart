// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

final class NotificationUpdateDto {
  const NotificationUpdateDto({this.readAt = const Optional.absent()});

  /// Date when notification was read
  final Optional<DateTime?> readAt;

  static NotificationUpdateDto? fromJson(dynamic value) {
    ApiCompat.upgrade<NotificationUpdateDto>(value);
    if (value is! Map) return null;
    final json = value.cast<String, dynamic>();
    return .new(
      readAt: json.containsKey(r'readAt')
          ? Optional.present((json[r'readAt'] == null ? null : DateTime.parse(json[r'readAt'] as String)))
          : const Optional.absent(),
    );
  }

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    if (readAt case Present(:final value)) {
      json[r'readAt'] = value?.toUtc().toIso8601String();
    }
    return json;
  }

  NotificationUpdateDto copyWith({Optional<DateTime?>? readAt}) {
    return .new(readAt: readAt ?? this.readAt);
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) || (other is NotificationUpdateDto && readAt == other.readAt);
  }

  @override
  int get hashCode {
    return Object.hashAll([readAt]);
  }

  @override
  String toString() => 'NotificationUpdateDto(readAt=$readAt)';
}
