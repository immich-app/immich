// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

final class NotificationUpdateAllDto {
  const NotificationUpdateAllDto({required this.ids, this.readAt = const Optional.absent()});

  /// Notification IDs to update
  final List<String> ids;

  /// Date when notifications were read
  final Optional<DateTime?> readAt;

  static NotificationUpdateAllDto? fromJson(dynamic value) {
    ApiCompat.upgrade<NotificationUpdateAllDto>(value);
    if (value is! Map) return null;
    final json = value.cast<String, dynamic>();
    return .new(
      ids: ((json[r'ids'] as List?)?.map(($e) => $e as String).toList(growable: false))!,
      readAt: json.containsKey(r'readAt')
          ? Optional.present((json[r'readAt'] == null ? null : DateTime.parse(json[r'readAt'] as String)))
          : const Optional.absent(),
    );
  }

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    json[r'ids'] = ids;
    if (readAt case Present(:final value)) {
      json[r'readAt'] = value?.toUtc().toIso8601String();
    }
    return json;
  }

  NotificationUpdateAllDto copyWith({List<String>? ids, Optional<DateTime?>? readAt}) {
    return .new(ids: ids ?? this.ids, readAt: readAt ?? this.readAt);
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other is NotificationUpdateAllDto &&
            const DeepCollectionEquality().equals(ids, other.ids) &&
            readAt == other.readAt);
  }

  @override
  int get hashCode {
    return Object.hashAll([const DeepCollectionEquality().hash(ids), readAt]);
  }

  @override
  String toString() => 'NotificationUpdateAllDto(ids=$ids, readAt=$readAt)';
}
