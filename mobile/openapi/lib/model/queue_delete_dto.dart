// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

final class QueueDeleteDto {
  const QueueDeleteDto({this.failed = const Optional.absent()});

  /// If true, will also remove failed jobs from the queue.
  /// Available since server v2.4.0.
  final Optional<bool> failed;

  static const ApiVersion failedAddedIn = .new(2, 4, 0);

  static const ApiState failedState = .alpha;

  static QueueDeleteDto? fromJson(dynamic value) {
    ApiCompat.upgrade<QueueDeleteDto>(value);
    if (value is! Map) return null;
    final json = value.cast<String, dynamic>();
    return .new(
      failed: json.containsKey(r'failed') ? Optional.present(json[r'failed'] as bool) : const Optional.absent(),
    );
  }

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    if (failed case Present(:final value)) {
      json[r'failed'] = value;
    }
    return json;
  }

  QueueDeleteDto copyWith({Optional<bool>? failed}) {
    return .new(failed: failed ?? this.failed);
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) || (other is QueueDeleteDto && failed == other.failed);
  }

  @override
  int get hashCode {
    return Object.hashAll([failed]);
  }

  @override
  String toString() => 'QueueDeleteDto(failed=$failed)';
}
