// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

final class SyncAckDto {
  const SyncAckDto({required this.ack, required this.type});

  /// Acknowledgment ID
  final String ack;

  final SyncEntityType type;

  static SyncAckDto? fromJson(dynamic value) {
    ApiCompat.upgrade<SyncAckDto>(value);
    if (value is! Map) return null;
    final json = value.cast<String, dynamic>();
    return .new(ack: json[r'ack'] as String, type: (SyncEntityType.fromJson(json[r'type']))!);
  }

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    json[r'ack'] = ack;
    json[r'type'] = type.toJson();
    return json;
  }

  SyncAckDto copyWith({String? ack, SyncEntityType? type}) {
    return .new(ack: ack ?? this.ack, type: type ?? this.type);
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) || (other is SyncAckDto && ack == other.ack && type == other.type);
  }

  @override
  int get hashCode {
    return Object.hashAll([ack, type]);
  }

  @override
  String toString() => 'SyncAckDto(ack=$ack, type=$type)';
}
