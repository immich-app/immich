// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

final class QueueJobResponseDto {
  const QueueJobResponseDto({required this.data, this.id, required this.name, required this.timestamp});

  /// Job data payload
  final Map<String, dynamic> data;

  /// Job ID
  final String? id;

  final JobName name;

  /// Job creation timestamp
  final int timestamp;

  static const _undefined = Object();

  static QueueJobResponseDto? fromJson(dynamic value) {
    ApiCompat.upgrade<QueueJobResponseDto>(value);
    if (value is! Map) return null;
    final json = value.cast<String, dynamic>();
    return .new(
      data: ((json[r'data'] as Map?)?.cast<String, dynamic>())!,
      id: (json[r'id'] as String?),
      name: (JobName.fromJson(json[r'name']))!,
      timestamp: json[r'timestamp'] as int,
    );
  }

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    json[r'data'] = data;
    if (id != null) {
      json[r'id'] = id!;
    }
    json[r'name'] = name.toJson();
    json[r'timestamp'] = timestamp;
    return json;
  }

  QueueJobResponseDto copyWith({Map<String, dynamic>? data, Object? id = _undefined, JobName? name, int? timestamp}) {
    return .new(
      data: data ?? this.data,
      id: identical(id, _undefined) ? this.id : id as String?,
      name: name ?? this.name,
      timestamp: timestamp ?? this.timestamp,
    );
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other is QueueJobResponseDto &&
            const DeepCollectionEquality().equals(data, other.data) &&
            id == other.id &&
            name == other.name &&
            timestamp == other.timestamp);
  }

  @override
  int get hashCode {
    return Object.hashAll([const DeepCollectionEquality().hash(data), id, name, timestamp]);
  }

  @override
  String toString() => 'QueueJobResponseDto(data=$data, id=$id, name=$name, timestamp=$timestamp)';
}
