class BackupConfig {
  final bool enabled;
  final bool useCellularForVideos;
  final bool useCellularForPhotos;
  final bool requireCharging;
  final int triggerDelay;
  final int parallelUploadCount;
  final bool syncAlbums;

  const BackupConfig({
    this.enabled = false,
    this.useCellularForVideos = false,
    this.useCellularForPhotos = false,
    this.requireCharging = false,
    this.triggerDelay = 30,
    this.parallelUploadCount = 3,
    this.syncAlbums = false,
  });

  BackupConfig copyWith({
    bool? enabled,
    bool? useCellularForVideos,
    bool? useCellularForPhotos,
    bool? requireCharging,
    int? triggerDelay,
    int? parallelUploadCount,
    bool? syncAlbums,
  }) => BackupConfig(
    enabled: enabled ?? this.enabled,
    useCellularForVideos: useCellularForVideos ?? this.useCellularForVideos,
    useCellularForPhotos: useCellularForPhotos ?? this.useCellularForPhotos,
    requireCharging: requireCharging ?? this.requireCharging,
    triggerDelay: triggerDelay ?? this.triggerDelay,
    parallelUploadCount: parallelUploadCount ?? this.parallelUploadCount,
    syncAlbums: syncAlbums ?? this.syncAlbums,
  );

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is BackupConfig &&
          other.enabled == enabled &&
          other.useCellularForVideos == useCellularForVideos &&
          other.useCellularForPhotos == useCellularForPhotos &&
          other.requireCharging == requireCharging &&
          other.triggerDelay == triggerDelay &&
          other.parallelUploadCount == parallelUploadCount &&
          other.syncAlbums == syncAlbums);

  @override
  int get hashCode =>
      Object.hash(enabled, useCellularForVideos, useCellularForPhotos, requireCharging, triggerDelay, parallelUploadCount, syncAlbums);

  @override
  String toString() =>
      'BackupConfig(enabled: $enabled, useCellularForVideos: $useCellularForVideos, useCellularForPhotos: $useCellularForPhotos, requireCharging: $requireCharging, triggerDelay: $triggerDelay, parallelUploadCount: $parallelUploadCount, syncAlbums: $syncAlbums)';
}
