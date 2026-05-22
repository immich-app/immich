//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class MaintenanceDetectInstallStorageFolderDto {
  /// Returns a new [MaintenanceDetectInstallStorageFolderDto] instance.
  MaintenanceDetectInstallStorageFolderDto({
    required this.files,
    required this.folder,
    required this.readable,
    required this.writable,
  });

  /// Number of files in the folder
  num files;

  /// Storage folder
  StorageFolder folder;

  /// Whether the folder is readable
  bool readable;

  /// Whether the folder is writable
  bool writable;

  @override
  bool operator ==(Object other) => identical(this, other) || other is MaintenanceDetectInstallStorageFolderDto &&
    other.files == files &&
    other.folder == folder &&
    other.readable == readable &&
    other.writable == writable;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (files.hashCode) +
    (folder.hashCode) +
    (readable.hashCode) +
    (writable.hashCode);

  @override
  String toString() => 'MaintenanceDetectInstallStorageFolderDto[files=$files, folder=$folder, readable=$readable, writable=$writable]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'files'] = this.files;
      json[r'folder'] = this.folder;
      json[r'readable'] = this.readable;
      json[r'writable'] = this.writable;
    return json;
  }

  /// Returns a new [MaintenanceDetectInstallStorageFolderDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static MaintenanceDetectInstallStorageFolderDto? fromJson(dynamic value) {
    upgradeDto(value, "MaintenanceDetectInstallStorageFolderDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return MaintenanceDetectInstallStorageFolderDto(
        files: num.parse('${json[r'files']}'),
        folder: StorageFolder.fromJson(json[r'folder'])!,
        readable: mapValueOfType<bool>(json, r'readable')!,
        writable: mapValueOfType<bool>(json, r'writable')!,
      );
    }
    return null;
  }

  static List<MaintenanceDetectInstallStorageFolderDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <MaintenanceDetectInstallStorageFolderDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = MaintenanceDetectInstallStorageFolderDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, MaintenanceDetectInstallStorageFolderDto> mapFromJson(dynamic json) {
    final map = <String, MaintenanceDetectInstallStorageFolderDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = MaintenanceDetectInstallStorageFolderDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of MaintenanceDetectInstallStorageFolderDto-objects as value to a dart map
  static Map<String, List<MaintenanceDetectInstallStorageFolderDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<MaintenanceDetectInstallStorageFolderDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = MaintenanceDetectInstallStorageFolderDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'files',
    'folder',
    'readable',
    'writable',
  };
}

