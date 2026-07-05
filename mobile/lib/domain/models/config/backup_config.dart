class BackupConfig {
  final bool enabled;
  final bool useCellularForVideos;
  final bool allowMeteredVpnForVideos;
  final bool useCellularForPhotos;
  final bool allowMeteredVpnForPhotos;
  final bool requireCharging;
  final int triggerDelay;
  final bool syncAlbums;

  const BackupConfig({
    this.enabled = false,
    this.useCellularForVideos = false,
    this.allowMeteredVpnForVideos = false,
    this.useCellularForPhotos = false,
    this.allowMeteredVpnForPhotos = false,
    this.requireCharging = false,
    this.triggerDelay = 30,
    this.syncAlbums = false,
  });

  BackupConfig copyWith({
    bool? enabled,
    bool? useCellularForVideos,
    bool? allowMeteredVpnForVideos,
    bool? useCellularForPhotos,
    bool? allowMeteredVpnForPhotos,
    bool? requireCharging,
    int? triggerDelay,
    bool? syncAlbums,
  }) => BackupConfig(
    enabled: enabled ?? this.enabled,
    useCellularForVideos: useCellularForVideos ?? this.useCellularForVideos,
    allowMeteredVpnForVideos: allowMeteredVpnForVideos ?? this.allowMeteredVpnForVideos,
    useCellularForPhotos: useCellularForPhotos ?? this.useCellularForPhotos,
    allowMeteredVpnForPhotos: allowMeteredVpnForPhotos ?? this.allowMeteredVpnForPhotos,
    requireCharging: requireCharging ?? this.requireCharging,
    triggerDelay: triggerDelay ?? this.triggerDelay,
    syncAlbums: syncAlbums ?? this.syncAlbums,
  );

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is BackupConfig &&
          other.enabled == enabled &&
          other.useCellularForVideos == useCellularForVideos &&
          other.allowMeteredVpnForVideos == allowMeteredVpnForVideos &&
          other.useCellularForPhotos == useCellularForPhotos &&
          other.allowMeteredVpnForPhotos == allowMeteredVpnForPhotos &&
          other.requireCharging == requireCharging &&
          other.triggerDelay == triggerDelay &&
          other.syncAlbums == syncAlbums);

  @override
  int get hashCode => Object.hash(
    enabled,
    useCellularForVideos,
    allowMeteredVpnForVideos,
    useCellularForPhotos,
    allowMeteredVpnForPhotos,
    requireCharging,
    triggerDelay,
    syncAlbums,
  );

  @override
  String toString() =>
      'BackupConfig(enabled: $enabled, useCellularForVideos: $useCellularForVideos, allowMeteredVpnForVideos: $allowMeteredVpnForVideos, useCellularForPhotos: $useCellularForPhotos, allowMeteredVpnForPhotos: $allowMeteredVpnForPhotos, requireCharging: $requireCharging, triggerDelay: $triggerDelay, syncAlbums: $syncAlbums)';
}
