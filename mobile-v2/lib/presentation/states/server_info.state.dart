import 'package:flutter/foundation.dart';
import 'package:immich_mobile/domain/interfaces/api/server_api.interface.dart';
import 'package:immich_mobile/domain/models/server-info/server_info.model.dart';
import 'package:immich_mobile/presentation/states/app_info.state.dart';
import 'package:immich_mobile/service_locator.dart';

class ServerInfoProvider extends ValueNotifier<ServerInfo> {
  final IServerApiRepository _serverApiRepository;

  ServerInfoProvider({required IServerApiRepository serverApiRepo})
      : _serverApiRepository = serverApiRepo,
        super(const ServerInfo.initial());

  Future<void> fetchFeatures() async =>
      await Future.wait([_getFeatures(), _getConfig(), _getVersion()]);

  Future<void> _getFeatures() async {
    final features = await _serverApiRepository.getServerFeatures();
    if (features != null) {
      value = value.copyWith(features: features);
    }
  }

  Future<void> _getConfig() async {
    final config = await _serverApiRepository.getServerConfig();
    if (config != null) {
      value = value.copyWith(config: config);
    }
  }

  Future<void> _getVersion() async {
    final version = await _serverApiRepository.getServerVersion();
    di<AppInfoProvider>().checkVersionMismatch(version);
    if (version != null) {
      value = value.copyWith(version: version);
    }
  }

  Future<void> fetchServerDisk() async {
    final disk = await _serverApiRepository.getServerDiskInfo();
    if (disk != null) {
      value = value.copyWith(disk: disk);
    }
  }
}
