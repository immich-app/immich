import 'package:hooks_riverpod/hooks_riverpod.dart';

import 'package:immich_mobile/shared/models/mapbox_info.model.dart';
import 'package:immich_mobile/shared/models/server_info_state.model.dart';
import 'package:immich_mobile/shared/models/server_version.model.dart';
import 'package:immich_mobile/shared/services/server_info.service.dart';

class ServerInfoNotifier extends StateNotifier<ServerInfoState> {
  ServerInfoNotifier()
      : super(
          ServerInfoState(
            mapboxInfo: MapboxInfo(isEnable: false, mapboxSecret: ""),
            serverVersion: ServerVersion(serverVersion: "0.0.0"),
            isVersionMismatch: false,
          ),
        );

  final ServerInfoService _serverInfoService = ServerInfoService();

  getMapboxInfo() async {
    MapboxInfo mapboxInfoRes = await _serverInfoService.getMapboxInfo();
    state = state.copyWith(mapboxInfo: mapboxInfoRes);
  }

  getServerVersion() async {
    ServerVersion? serverVersion = await _serverInfoService.getServerVersion();

    if (serverVersion == null) {}
  }
}

final serverInfoProvider = StateNotifierProvider<ServerInfoNotifier, ServerInfoState>((ref) {
  return ServerInfoNotifier();
});
