// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

final class ActivityStatisticsResponseDto {
  const ActivityStatisticsResponseDto({required this.comments, required this.likes});

  /// Number of comments
  final int comments;

  /// Number of likes
  final int likes;

  static ActivityStatisticsResponseDto? fromJson(dynamic value) {
    ApiCompat.upgrade<ActivityStatisticsResponseDto>(value);
    if (value is! Map) return null;
    final json = value.cast<String, dynamic>();
    return .new(comments: json[r'comments'] as int, likes: json[r'likes'] as int);
  }

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    json[r'comments'] = comments;
    json[r'likes'] = likes;
    return json;
  }

  ActivityStatisticsResponseDto copyWith({int? comments, int? likes}) {
    return .new(comments: comments ?? this.comments, likes: likes ?? this.likes);
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other is ActivityStatisticsResponseDto && comments == other.comments && likes == other.likes);
  }

  @override
  int get hashCode {
    return Object.hashAll([comments, likes]);
  }

  @override
  String toString() => 'ActivityStatisticsResponseDto(comments=$comments, likes=$likes)';
}
