// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

final class MaintenanceDetectInstallStorageFolderDto {
  const MaintenanceDetectInstallStorageFolderDto({
    required this.files,
    required this.folder,
    required this.readable,
    required this.writable,
  });

  /// Number of files in the folder
  final int files;

  final StorageFolder folder;

  /// Whether the folder is readable
  final bool readable;

  /// Whether the folder is writable
  final bool writable;

  static MaintenanceDetectInstallStorageFolderDto? fromJson(dynamic value) {
    ApiCompat.upgrade<MaintenanceDetectInstallStorageFolderDto>(value);
    if (value is! Map) return null;
    final json = value.cast<String, dynamic>();
    return .new(
      files: json[r'files'] as int,
      folder: (StorageFolder.fromJson(json[r'folder']))!,
      readable: json[r'readable'] as bool,
      writable: json[r'writable'] as bool,
    );
  }

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    json[r'files'] = files;
    json[r'folder'] = folder.toJson();
    json[r'readable'] = readable;
    json[r'writable'] = writable;
    return json;
  }

  MaintenanceDetectInstallStorageFolderDto copyWith({
    int? files,
    StorageFolder? folder,
    bool? readable,
    bool? writable,
  }) {
    return .new(
      files: files ?? this.files,
      folder: folder ?? this.folder,
      readable: readable ?? this.readable,
      writable: writable ?? this.writable,
    );
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other is MaintenanceDetectInstallStorageFolderDto &&
            files == other.files &&
            folder == other.folder &&
            readable == other.readable &&
            writable == other.writable);
  }

  @override
  int get hashCode {
    return Object.hashAll([files, folder, readable, writable]);
  }

  @override
  String toString() =>
      'MaintenanceDetectInstallStorageFolderDto(files=$files, folder=$folder, readable=$readable, writable=$writable)';
}
