import 'dart:convert';

enum DownloadAssetStatus { idle, loading, success, error }

class AssetViewerPageState {
  // enum
  final DownloadAssetStatus downloadAssetStatus;

  AssetViewerPageState({
    required this.downloadAssetStatus,
  });

  AssetViewerPageState copyWith({
    DownloadAssetStatus? downloadAssetStatus,
  }) {
    return AssetViewerPageState(
      downloadAssetStatus: downloadAssetStatus ?? this.downloadAssetStatus,
    );
  }

  Map<String, dynamic> toMap() {
    final result = <String, dynamic>{};

    result.addAll({'downloadAssetStatus': downloadAssetStatus.index});

    return result;
  }

  factory AssetViewerPageState.fromMap(Map<String, dynamic> map) {
    return AssetViewerPageState(
      downloadAssetStatus:
          DownloadAssetStatus.values[map['downloadAssetStatus'] ?? 0],
    );
  }

  String toJson() => json.encode(toMap());

  factory AssetViewerPageState.fromJson(String source) =>
      AssetViewerPageState.fromMap(json.decode(source));

  @override
  String toString() =>
      'ImageViewerPageState(downloadAssetStatus: $downloadAssetStatus)';

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;

    return other is AssetViewerPageState &&
        other.downloadAssetStatus == downloadAssetStatus;
  }

  @override
  int get hashCode => downloadAssetStatus.hashCode;
}
