// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

final class SystemConfigTemplateEmailsDto {
  const SystemConfigTemplateEmailsDto({
    required this.albumInviteTemplate,
    required this.albumUpdateTemplate,
    required this.welcomeTemplate,
  });

  /// Album invite template
  final String albumInviteTemplate;

  /// Album update template
  final String albumUpdateTemplate;

  /// Welcome template
  final String welcomeTemplate;

  static SystemConfigTemplateEmailsDto? fromJson(dynamic value) {
    ApiCompat.upgrade<SystemConfigTemplateEmailsDto>(value);
    if (value is! Map) return null;
    final json = value.cast<String, dynamic>();
    return .new(
      albumInviteTemplate: json[r'albumInviteTemplate'] as String,
      albumUpdateTemplate: json[r'albumUpdateTemplate'] as String,
      welcomeTemplate: json[r'welcomeTemplate'] as String,
    );
  }

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    json[r'albumInviteTemplate'] = albumInviteTemplate;
    json[r'albumUpdateTemplate'] = albumUpdateTemplate;
    json[r'welcomeTemplate'] = welcomeTemplate;
    return json;
  }

  SystemConfigTemplateEmailsDto copyWith({
    String? albumInviteTemplate,
    String? albumUpdateTemplate,
    String? welcomeTemplate,
  }) {
    return .new(
      albumInviteTemplate: albumInviteTemplate ?? this.albumInviteTemplate,
      albumUpdateTemplate: albumUpdateTemplate ?? this.albumUpdateTemplate,
      welcomeTemplate: welcomeTemplate ?? this.welcomeTemplate,
    );
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other is SystemConfigTemplateEmailsDto &&
            albumInviteTemplate == other.albumInviteTemplate &&
            albumUpdateTemplate == other.albumUpdateTemplate &&
            welcomeTemplate == other.welcomeTemplate);
  }

  @override
  int get hashCode {
    return Object.hashAll([albumInviteTemplate, albumUpdateTemplate, welcomeTemplate]);
  }

  @override
  String toString() =>
      'SystemConfigTemplateEmailsDto(albumInviteTemplate=$albumInviteTemplate, albumUpdateTemplate=$albumUpdateTemplate, welcomeTemplate=$welcomeTemplate)';
}
