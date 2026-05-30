import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/config/app_config.dart';
import 'package:immich_mobile/infrastructure/repositories/db.repository.dart';
import 'package:immich_mobile/infrastructure/repositories/sync_stream.repository.dart';
import 'package:immich_mobile/models/auth/auxilary_endpoint.model.dart';
import 'package:immich_mobile/providers/infrastructure/db.provider.dart';
import 'package:immich_mobile/providers/infrastructure/settings.provider.dart';

final authRepositoryProvider = Provider<AuthRepository>(
  (ref) => AuthRepository(ref.watch(driftProvider), ref.watch(appConfigProvider)),
);

class AuthRepository {
  final Drift _drift;
  final AppConfig _config;

  const AuthRepository(this._drift, this._config);

  Future<void> clearLocalData() async {
    await SyncStreamRepository(_drift).reset();
  }

  bool getEndpointSwitchingFeature() {
    return _config.network.autoEndpointSwitching;
  }

  String? getPreferredWifiName() {
    return _config.network.preferredWifiName;
  }

  String? getLocalEndpoint() {
    return _config.network.localEndpoint;
  }

  List<AuxilaryEndpoint> getExternalEndpointList() {
    return _config.network.externalEndpointList.map((url) => AuxilaryEndpoint(url: url, status: .valid)).toList();
  }
}
