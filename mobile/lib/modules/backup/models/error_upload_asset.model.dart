import 'package:equatable/equatable.dart';
import 'package:photo_manager/photo_manager.dart';

import 'current_upload_asset.model.dart';

class ErrorUploadAsset extends Equatable {
  final String id;
  final DateTime createdAt;
  final CurrentUploadAsset uploadAsset;
  final String fileName;
  final String fileType;
  final AssetEntity asset;
  final String errorMessage;

  const ErrorUploadAsset({
    required this.id,
    required this.createdAt,
    required this.uploadAsset,
    required this.fileName,
    required this.fileType,
    required this.asset,
    required this.errorMessage,
  });

  ErrorUploadAsset copyWith({
    String? id,
    DateTime? createdAt,
    CurrentUploadAsset? uploadAsset,
    String? fileName,
    String? fileType,
    AssetEntity? asset,
    String? errorMessage,
  }) {
    return ErrorUploadAsset(
      id: id ?? this.id,
      createdAt: createdAt ?? this.createdAt,
      uploadAsset: uploadAsset ?? this.uploadAsset,
      fileName: fileName ?? this.fileName,
      fileType: fileType ?? this.fileType,
      asset: asset ?? this.asset,
      errorMessage: errorMessage ?? this.errorMessage,
    );
  }

  @override
  String toString() {
    return 'ErrorUploadAsset(id: $id, createdAt: $createdAt, uploadAsset: $uploadAsset, fileName: $fileName, fileType: $fileType, asset: $asset, errorMessage: $errorMessage)';
  }

  @override
  List<Object> get props {
    return [
      id,
      fileName,
      fileType,
      errorMessage,
    ];
  }
}
