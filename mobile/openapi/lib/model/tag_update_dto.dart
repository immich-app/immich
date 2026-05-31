// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

final class TagUpdateDto {
  const TagUpdateDto({this.color = const Optional.absent()});

  /// Tag color (hex)
  final Optional<String?> color;

  static TagUpdateDto? fromJson(dynamic value) {
    ApiCompat.upgrade<TagUpdateDto>(value);
    if (value is! Map) return null;
    final json = value.cast<String, dynamic>();
    return .new(
      color: json.containsKey(r'color') ? Optional.present((json[r'color'] as String?)) : const Optional.absent(),
    );
  }

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    if (color case Present(:final value)) {
      json[r'color'] = value;
    }
    return json;
  }

  TagUpdateDto copyWith({Optional<String?>? color}) {
    return .new(color: color ?? this.color);
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) || (other is TagUpdateDto && color == other.color);
  }

  @override
  int get hashCode {
    return Object.hashAll([color]);
  }

  @override
  String toString() => 'TagUpdateDto(color=$color)';
}
