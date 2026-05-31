// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

final class SystemConfigLibraryDto {
  const SystemConfigLibraryDto({required this.scan, required this.watch});

  final SystemConfigLibraryScanDto scan;

  final SystemConfigLibraryWatchDto watch;

  static SystemConfigLibraryDto? fromJson(dynamic value) {
    ApiCompat.upgrade<SystemConfigLibraryDto>(value);
    if (value is! Map) return null;
    final json = value.cast<String, dynamic>();
    return .new(
      scan: (SystemConfigLibraryScanDto.fromJson(json[r'scan']))!,
      watch: (SystemConfigLibraryWatchDto.fromJson(json[r'watch']))!,
    );
  }

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    json[r'scan'] = scan.toJson();
    json[r'watch'] = watch.toJson();
    return json;
  }

  SystemConfigLibraryDto copyWith({SystemConfigLibraryScanDto? scan, SystemConfigLibraryWatchDto? watch}) {
    return .new(scan: scan ?? this.scan, watch: watch ?? this.watch);
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) || (other is SystemConfigLibraryDto && scan == other.scan && watch == other.watch);
  }

  @override
  int get hashCode {
    return Object.hashAll([scan, watch]);
  }

  @override
  String toString() => 'SystemConfigLibraryDto(scan=$scan, watch=$watch)';
}
