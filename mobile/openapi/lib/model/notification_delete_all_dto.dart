// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

final class NotificationDeleteAllDto {
  const NotificationDeleteAllDto({required this.ids});

  /// Notification IDs to delete
  final List<String> ids;

  static NotificationDeleteAllDto? fromJson(dynamic value) {
    ApiCompat.upgrade<NotificationDeleteAllDto>(value);
    if (value is! Map) return null;
    final json = value.cast<String, dynamic>();
    return .new(ids: ((json[r'ids'] as List?)?.map(($e) => $e as String).toList(growable: false))!);
  }

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    json[r'ids'] = ids;
    return json;
  }

  NotificationDeleteAllDto copyWith({List<String>? ids}) {
    return .new(ids: ids ?? this.ids);
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other is NotificationDeleteAllDto && const DeepCollectionEquality().equals(ids, other.ids));
  }

  @override
  int get hashCode {
    return Object.hashAll([const DeepCollectionEquality().hash(ids)]);
  }

  @override
  String toString() => 'NotificationDeleteAllDto(ids=$ids)';
}
