import 'dart:async';

import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/models/server_info/server_disk_info.model.dart';
import 'package:immich_mobile/services/server_info.service.dart';

final backupProvider = StateNotifierProvider<BackupNotifier, ServerDiskInfo>((ref) {
  return BackupNotifier(ref.watch(serverInfoServiceProvider));
});

class BackupNotifier extends StateNotifier<ServerDiskInfo> {
  BackupNotifier(this._serverInfoService)
    : super(const ServerDiskInfo(diskAvailable: "0", diskSize: "0", diskUse: "0", diskUsagePercentage: 0));

  final ServerInfoService _serverInfoService;

  Future<void> updateDiskInfo() async {
    final diskInfo = await _serverInfoService.getDiskInfo();
    if (diskInfo != null) {
      state = diskInfo;
    }
  }
}
