import 'dart:convert';

enum DownloadAssetStatus { idle, loading, success, error }

class ImageViewerPageState {
  // enum
  final DownloadAssetStatus downloadAssetStatus;

  ImageViewerPageState({
    required this.downloadAssetStatus,
  });

  ImageViewerPageState copyWith({
    DownloadAssetStatus? downloadAssetStatus,
  }) {
    return ImageViewerPageState(
      downloadAssetStatus: downloadAssetStatus ?? this.downloadAssetStatus,
    );
  }

  Map<String, dynamic> toMap() {
    final result = <String, dynamic>{};

    result.addAll({'downloadAssetStatus': downloadAssetStatus.index});

    return result;
  }

  factory ImageViewerPageState.fromMap(Map<String, dynamic> map) {
    return ImageViewerPageState(
      downloadAssetStatus:
          DownloadAssetStatus.values[map['downloadAssetStatus'] ?? 0],
    );
  }

  String toJson() => json.encode(toMap());

  factory ImageViewerPageState.fromJson(String source) =>
      ImageViewerPageState.fromMap(json.decode(source));

  @override
  String toString() =>
      'ImageViewerPageState(downloadAssetStatus: $downloadAssetStatus)';

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;

    return other is ImageViewerPageState &&
        other.downloadAssetStatus == downloadAssetStatus;
  }

  @override
  int get hashCode => downloadAssetStatus.hashCode;
}
