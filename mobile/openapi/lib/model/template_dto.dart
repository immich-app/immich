// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

final class TemplateDto {
  const TemplateDto({required this.template});

  /// Template name
  final String template;

  static TemplateDto? fromJson(dynamic value) {
    ApiCompat.upgrade<TemplateDto>(value);
    if (value is! Map) return null;
    final json = value.cast<String, dynamic>();
    return .new(template: json[r'template'] as String);
  }

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    json[r'template'] = template;
    return json;
  }

  TemplateDto copyWith({String? template}) {
    return .new(template: template ?? this.template);
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) || (other is TemplateDto && template == other.template);
  }

  @override
  int get hashCode {
    return Object.hashAll([template]);
  }

  @override
  String toString() => 'TemplateDto(template=$template)';
}
