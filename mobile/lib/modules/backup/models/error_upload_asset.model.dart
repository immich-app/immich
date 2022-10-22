import 'package:equatable/equatable.dart';
import 'package:photo_manager/photo_manager.dart';

class ErrorUploadAsset extends Equatable {
  final String id;
  final DateTime createdAt;
  final String fileName;
  final String fileType;
  final AssetEntity asset;
  final String errorMessage;
  final bool isDuplicated;

  const ErrorUploadAsset({
    required this.id,
    required this.createdAt,
    required this.fileName,
    required this.fileType,
    required this.asset,
    required this.errorMessage,
    required this.isDuplicated,
  });

  ErrorUploadAsset copyWith({
    String? id,
    DateTime? createdAt,
    String? fileName,
    String? fileType,
    AssetEntity? asset,
    String? errorMessage,
    bool? isDuplicated,
  }) {
    return ErrorUploadAsset(
      id: id ?? this.id,
      createdAt: createdAt ?? this.createdAt,
      fileName: fileName ?? this.fileName,
      fileType: fileType ?? this.fileType,
      asset: asset ?? this.asset,
      errorMessage: errorMessage ?? this.errorMessage,
      isDuplicated: isDuplicated ?? this.isDuplicated,
    );
  }

  @override
  String toString() {
    return 'ErrorUploadAsset(id: $id, createdAt: $createdAt, fileName: $fileName, fileType: $fileType, asset: $asset, errorMessage: $errorMessage, isDuplicated: $isDuplicated)';
  }

  @override
  List<Object> get props {
    return [
      id,
      createdAt,
      fileName,
      fileType,
      asset,
      errorMessage,
      isDuplicated,
    ];
  }
}
