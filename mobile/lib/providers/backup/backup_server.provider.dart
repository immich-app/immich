import 'dart:async';

import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/models/server_info/server_disk_info.model.dart';
import 'package:immich_mobile/services/server_info.service.dart';

final backupServerProvider = StateNotifierProvider<BackupServerNotifier, ServerDiskInfo>((ref) {
  return BackupServerNotifier(ref.watch(serverInfoServiceProvider));
});

class BackupServerNotifier extends StateNotifier<ServerDiskInfo> {
  BackupServerNotifier(this._serverInfoService)
    : super(const ServerDiskInfo(diskAvailable: "0", diskSize: "0", diskUse: "0", diskUsagePercentage: 0));

  final ServerInfoService _serverInfoService;

  Future<void> updateDiskInfo() async {
    final diskInfo = await _serverInfoService.getDiskInfo();
    if (diskInfo != null) {
      state = diskInfo;
    }
  }
}
