// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

final class ServerApkLinksDto {
  const ServerApkLinksDto({
    required this.arm64v8a,
    required this.armeabiv7a,
    required this.universal,
    required this.x8664,
  });

  /// APK download link for ARM64 v8a architecture
  final String arm64v8a;

  /// APK download link for ARM EABI v7a architecture
  final String armeabiv7a;

  /// APK download link for universal architecture
  final String universal;

  /// APK download link for x86_64 architecture
  final String x8664;

  static ServerApkLinksDto? fromJson(dynamic value) {
    ApiCompat.upgrade<ServerApkLinksDto>(value);
    if (value is! Map) return null;
    final json = value.cast<String, dynamic>();
    return .new(
      arm64v8a: json[r'arm64v8a'] as String,
      armeabiv7a: json[r'armeabiv7a'] as String,
      universal: json[r'universal'] as String,
      x8664: json[r'x86_64'] as String,
    );
  }

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    json[r'arm64v8a'] = arm64v8a;
    json[r'armeabiv7a'] = armeabiv7a;
    json[r'universal'] = universal;
    json[r'x86_64'] = x8664;
    return json;
  }

  ServerApkLinksDto copyWith({String? arm64v8a, String? armeabiv7a, String? universal, String? x8664}) {
    return .new(
      arm64v8a: arm64v8a ?? this.arm64v8a,
      armeabiv7a: armeabiv7a ?? this.armeabiv7a,
      universal: universal ?? this.universal,
      x8664: x8664 ?? this.x8664,
    );
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other is ServerApkLinksDto &&
            arm64v8a == other.arm64v8a &&
            armeabiv7a == other.armeabiv7a &&
            universal == other.universal &&
            x8664 == other.x8664);
  }

  @override
  int get hashCode {
    return Object.hashAll([arm64v8a, armeabiv7a, universal, x8664]);
  }

  @override
  String toString() =>
      'ServerApkLinksDto(arm64v8a=$arm64v8a, armeabiv7a=$armeabiv7a, universal=$universal, x8664=$x8664)';
}
