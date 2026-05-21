import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/infrastructure/repositories/db.repository.dart';
import 'package:immich_mobile/infrastructure/repositories/metadata.repository.dart';
import 'package:immich_mobile/infrastructure/repositories/sync_stream.repository.dart';
import 'package:immich_mobile/models/auth/auxilary_endpoint.model.dart';
import 'package:immich_mobile/providers/infrastructure/db.provider.dart';
import 'package:immich_mobile/providers/infrastructure/metadata.provider.dart';

final authRepositoryProvider = Provider<AuthRepository>(
  (ref) => AuthRepository(ref.watch(driftProvider), ref.watch(metadataProvider)),
);

class AuthRepository {
  final Drift _drift;
  final MetadataRepository _metadata;

  const AuthRepository(this._drift, this._metadata);

  Future<void> clearLocalData() async {
    await SyncStreamRepository(_drift).reset();
  }

  bool getEndpointSwitchingFeature() {
    return _metadata.systemConfig.network.autoEndpointSwitching;
  }

  String? getPreferredWifiName() {
    return _metadata.systemConfig.network.preferredWifiName;
  }

  String? getLocalEndpoint() {
    return _metadata.systemConfig.network.localEndpoint;
  }

  List<AuxilaryEndpoint> getExternalEndpointList() {
    return _metadata.systemConfig.network.externalEndpointList
        .map((url) => AuxilaryEndpoint(url: url, status: .valid))
        .toList();
  }
}
