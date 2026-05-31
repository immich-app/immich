// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

final class TemplateResponseDto {
  const TemplateResponseDto({required this.html, required this.name});

  /// Template HTML content
  final String html;

  /// Template name
  final String name;

  static TemplateResponseDto? fromJson(dynamic value) {
    ApiCompat.upgrade<TemplateResponseDto>(value);
    if (value is! Map) return null;
    final json = value.cast<String, dynamic>();
    return .new(html: json[r'html'] as String, name: json[r'name'] as String);
  }

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    json[r'html'] = html;
    json[r'name'] = name;
    return json;
  }

  TemplateResponseDto copyWith({String? html, String? name}) {
    return .new(html: html ?? this.html, name: name ?? this.name);
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) || (other is TemplateResponseDto && html == other.html && name == other.name);
  }

  @override
  int get hashCode {
    return Object.hashAll([html, name]);
  }

  @override
  String toString() => 'TemplateResponseDto(html=$html, name=$name)';
}
