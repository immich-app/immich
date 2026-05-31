// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

final class SessionUpdateDto {
  const SessionUpdateDto({this.isPendingSyncReset = const Optional.absent()});

  /// Reset pending sync state
  final Optional<bool> isPendingSyncReset;

  static SessionUpdateDto? fromJson(dynamic value) {
    ApiCompat.upgrade<SessionUpdateDto>(value);
    if (value is! Map) return null;
    final json = value.cast<String, dynamic>();
    return .new(
      isPendingSyncReset: json.containsKey(r'isPendingSyncReset')
          ? Optional.present(json[r'isPendingSyncReset'] as bool)
          : const Optional.absent(),
    );
  }

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    if (isPendingSyncReset case Present(:final value)) {
      json[r'isPendingSyncReset'] = value;
    }
    return json;
  }

  SessionUpdateDto copyWith({Optional<bool>? isPendingSyncReset}) {
    return .new(isPendingSyncReset: isPendingSyncReset ?? this.isPendingSyncReset);
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) || (other is SessionUpdateDto && isPendingSyncReset == other.isPendingSyncReset);
  }

  @override
  int get hashCode {
    return Object.hashAll([isPendingSyncReset]);
  }

  @override
  String toString() => 'SessionUpdateDto(isPendingSyncReset=$isPendingSyncReset)';
}
