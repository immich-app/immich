import 'dart:io';
import 'dart:isolate';

enum BackupDataSavingModeEnum {
  original,
  print,
  tv,
  hd;
}

class BackupDataSavingModeType {
  BackupDataSavingModeType({
    BackupDataSavingModeEnum mode = BackupDataSavingModeEnum.original,
    int? modeInt,
  }) : _mode = modeInt ?? mode.index;

  int _mode;

  final _resolution = {
    BackupDataSavingModeEnum.print: [5312, 2988],
    BackupDataSavingModeEnum.tv: [3840, 2160],
    BackupDataSavingModeEnum.hd: [1920, 1080],
  };

  set mode(BackupDataSavingModeEnum value) => _mode = value.index;

  BackupDataSavingModeEnum get mode => BackupDataSavingModeEnum.values[_mode];

  int get modeInt => _mode;

  bool get isSaving => mode != BackupDataSavingModeEnum.original;

  int? get maxWidth => _resolution[mode]?[0];

  int? get maxHeight => _resolution[mode]?[1];

  int? get maxPixels => _resolution[mode] == null ? null : _resolution[mode]![0] * _resolution[mode]![1];

  @override
  bool operator ==(dynamic other) => other != null && other is BackupDataSavingModeType && this._mode == other._mode;

  @override
  int get hashCode => _mode.hashCode;
}

class DataSavingImageMetadata {
  DataSavingImageMetadata({
    required this.success,
    this.file,
    this.newHeight,
    this.newWidth,
  });

  static get fail => DataSavingImageMetadata(success: false);

  final bool success;
  final File? file;
  final int? newHeight;
  final int? newWidth;
}

class DataSavingResizeCommand {
  DataSavingResizeCommand({
    required this.sendPort,
    required this.dataSavingMode,
    required this.file,
    required this.originalFileName,
    required this.tempDir,
  });

  final SendPort sendPort;
  final BackupDataSavingModeType dataSavingMode;
  final File file;
  final String originalFileName;
  final Directory tempDir;
}