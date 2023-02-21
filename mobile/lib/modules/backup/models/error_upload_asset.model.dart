import 'package:photo_manager/photo_manager.dart';

class ErrorUploadAsset {
  final String id;
  final DateTime fileCreatedAt;
  final String fileName;
  final String fileType;
  final AssetEntity asset;
  final String errorMessage;

  const ErrorUploadAsset({
    required this.id,
    required this.fileCreatedAt,
    required this.fileName,
    required this.fileType,
    required this.asset,
    required this.errorMessage,
  });

  ErrorUploadAsset copyWith({
    String? id,
    DateTime? fileCreatedAt,
    String? fileName,
    String? fileType,
    AssetEntity? asset,
    String? errorMessage,
  }) {
    return ErrorUploadAsset(
      id: id ?? this.id,
      fileCreatedAt: fileCreatedAt ?? this.fileCreatedAt,
      fileName: fileName ?? this.fileName,
      fileType: fileType ?? this.fileType,
      asset: asset ?? this.asset,
      errorMessage: errorMessage ?? this.errorMessage,
    );
  }

  @override
  String toString() {
    return 'ErrorUploadAsset(id: $id, fileCreatedAt: $fileCreatedAt, fileName: $fileName, fileType: $fileType, asset: $asset, errorMessage: $errorMessage)';
  }

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;

    return other is ErrorUploadAsset &&
        other.id == id &&
        other.fileCreatedAt == fileCreatedAt &&
        other.fileName == fileName &&
        other.fileType == fileType &&
        other.asset == asset &&
        other.errorMessage == errorMessage;
  }

  @override
  int get hashCode {
    return id.hashCode ^
        fileCreatedAt.hashCode ^
        fileName.hashCode ^
        fileType.hashCode ^
        asset.hashCode ^
        errorMessage.hashCode;
  }
}
