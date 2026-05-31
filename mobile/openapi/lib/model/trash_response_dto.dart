// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

final class TrashResponseDto {
  const TrashResponseDto({required this.count});

  /// Number of items in trash
  final int count;

  static TrashResponseDto? fromJson(dynamic value) {
    ApiCompat.upgrade<TrashResponseDto>(value);
    if (value is! Map) return null;
    final json = value.cast<String, dynamic>();
    return .new(count: json[r'count'] as int);
  }

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    json[r'count'] = count;
    return json;
  }

  TrashResponseDto copyWith({int? count}) {
    return .new(count: count ?? this.count);
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) || (other is TrashResponseDto && count == other.count);
  }

  @override
  int get hashCode {
    return Object.hashAll([count]);
  }

  @override
  String toString() => 'TrashResponseDto(count=$count)';
}
