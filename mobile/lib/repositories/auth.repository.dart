import 'dart:convert';

import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/store.model.dart';
import 'package:immich_mobile/entities/store.entity.dart';
import 'package:immich_mobile/infrastructure/repositories/db.repository.dart';
import 'package:immich_mobile/infrastructure/repositories/sync_stream.repository.dart';
import 'package:immich_mobile/models/auth/auxilary_endpoint.model.dart';
import 'package:immich_mobile/providers/infrastructure/db.provider.dart';

final authRepositoryProvider = Provider<AuthRepository>((ref) => AuthRepository(ref.watch(driftProvider)));

class AuthRepository {
  final Drift _drift;

  const AuthRepository(this._drift);

  Future<void> clearLocalData() async {
    await SyncStreamRepository(_drift).reset();
  }

  bool getEndpointSwitchingFeature() {
    return Store.tryGet(StoreKey.autoEndpointSwitching) ?? false;
  }

  String? getPreferredWifiName() {
    return Store.tryGet(StoreKey.preferredWifiName);
  }

  String? getLocalEndpoint() {
    return Store.tryGet(StoreKey.localEndpoint);
  }

  List<AuxilaryEndpoint> getExternalEndpointList() {
    final jsonString = Store.tryGet(StoreKey.externalEndpointList);

    if (jsonString == null) {
      return [];
    }

    final List<dynamic> jsonList = jsonDecode(jsonString);
    final endpointList = jsonList.map((e) => AuxilaryEndpoint.fromJson(e)).toList();

    return endpointList;
  }
}
