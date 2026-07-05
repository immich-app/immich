import 'package:immich_mobile/constants/enums.dart';

class ShareConfig {
  final ShareAssetType fileType;

  const ShareConfig({this.fileType = ShareAssetType.original});

  ShareConfig copyWith({ShareAssetType? fileType}) => ShareConfig(fileType: fileType ?? this.fileType);

  @override
  bool operator ==(Object other) => identical(this, other) || (other is ShareConfig && other.fileType == fileType);

  @override
  int get hashCode => fileType.hashCode;

  @override
  String toString() => 'ShareConfig(fileType: $fileType)';
}
