import 'package:immich_mobile/constants/enums.dart';

class ShareConfig {
  final ShareAssetFileType fileType;

  const ShareConfig({this.fileType = ShareAssetFileType.original});

  ShareConfig copyWith({ShareAssetFileType? fileType}) => ShareConfig(fileType: fileType ?? this.fileType);

  @override
  bool operator ==(Object other) => identical(this, other) || (other is ShareConfig && other.fileType == fileType);

  @override
  int get hashCode => fileType.hashCode;

  @override
  String toString() => 'ShareConfig(fileType: $fileType)';
}
