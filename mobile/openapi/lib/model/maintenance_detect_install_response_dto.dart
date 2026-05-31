// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

final class MaintenanceDetectInstallResponseDto {
  const MaintenanceDetectInstallResponseDto({required this.storage});

  final List<MaintenanceDetectInstallStorageFolderDto> storage;

  static MaintenanceDetectInstallResponseDto? fromJson(dynamic value) {
    ApiCompat.upgrade<MaintenanceDetectInstallResponseDto>(value);
    if (value is! Map) return null;
    final json = value.cast<String, dynamic>();
    return .new(
      storage: ((json[r'storage'] as List?)
          ?.map(($e) => (MaintenanceDetectInstallStorageFolderDto.fromJson($e))!)
          .toList(growable: false))!,
    );
  }

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    json[r'storage'] = storage.map(($e) => $e.toJson()).toList(growable: false);
    return json;
  }

  MaintenanceDetectInstallResponseDto copyWith({List<MaintenanceDetectInstallStorageFolderDto>? storage}) {
    return .new(storage: storage ?? this.storage);
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other is MaintenanceDetectInstallResponseDto && const DeepCollectionEquality().equals(storage, other.storage));
  }

  @override
  int get hashCode {
    return Object.hashAll([const DeepCollectionEquality().hash(storage)]);
  }

  @override
  String toString() => 'MaintenanceDetectInstallResponseDto(storage=$storage)';
}
