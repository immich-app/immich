import 'package:photo_manager/photo_manager.dart';

class ErrorUploadAsset {
  final String id;
  final DateTime createdAt;
  final String fileName;
  final String fileType;
  final AssetEntity asset;
  final String errorMessage;

  const ErrorUploadAsset({
    required this.id,
    required this.createdAt,
    required this.fileName,
    required this.fileType,
    required this.asset,
    required this.errorMessage,
  });

  ErrorUploadAsset copyWith({
    String? id,
    DateTime? createdAt,
    String? fileName,
    String? fileType,
    AssetEntity? asset,
    String? errorMessage,
  }) {
    return ErrorUploadAsset(
      id: id ?? this.id,
      createdAt: createdAt ?? this.createdAt,
      fileName: fileName ?? this.fileName,
      fileType: fileType ?? this.fileType,
      asset: asset ?? this.asset,
      errorMessage: errorMessage ?? this.errorMessage,
    );
  }

  @override
  String toString() {
    return 'ErrorUploadAsset(id: $id, createdAt: $createdAt, fileName: $fileName, fileType: $fileType, asset: $asset, errorMessage: $errorMessage)';
  }

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;

    return other is ErrorUploadAsset &&
        other.id == id &&
        other.createdAt == createdAt &&
        other.fileName == fileName &&
        other.fileType == fileType &&
        other.asset == asset &&
        other.errorMessage == errorMessage;
  }

  @override
  int get hashCode {
    return id.hashCode ^
        createdAt.hashCode ^
        fileName.hashCode ^
        fileType.hashCode ^
        asset.hashCode ^
        errorMessage.hashCode;
  }
}
