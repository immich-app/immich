// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

final class QueueUpdateDto {
  const QueueUpdateDto({this.isPaused = const Optional.absent()});

  /// Whether to pause the queue
  final Optional<bool> isPaused;

  static QueueUpdateDto? fromJson(dynamic value) {
    ApiCompat.upgrade<QueueUpdateDto>(value);
    if (value is! Map) return null;
    final json = value.cast<String, dynamic>();
    return .new(
      isPaused: json.containsKey(r'isPaused') ? Optional.present(json[r'isPaused'] as bool) : const Optional.absent(),
    );
  }

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    if (isPaused case Present(:final value)) {
      json[r'isPaused'] = value;
    }
    return json;
  }

  QueueUpdateDto copyWith({Optional<bool>? isPaused}) {
    return .new(isPaused: isPaused ?? this.isPaused);
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) || (other is QueueUpdateDto && isPaused == other.isPaused);
  }

  @override
  int get hashCode {
    return Object.hashAll([isPaused]);
  }

  @override
  String toString() => 'QueueUpdateDto(isPaused=$isPaused)';
}
