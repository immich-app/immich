import 'dart:async';

import 'package:immich_mobile/domain/models/store.model.dart';
import 'package:immich_mobile/entities/store.entity.dart';
import 'package:immich_mobile/infrastructure/repositories/network.repository.dart';
import 'package:immich_mobile/services/api.service.dart';

const int targetVersion = 25;

Future<void> migrateDatabaseIfNeeded() async {
  final int version = Store.get(StoreKey.version, targetVersion);

  if (version < 25) {
    final accessToken = Store.tryGet(StoreKey.accessToken);
    if (accessToken != null && accessToken.isNotEmpty) {
      final serverUrls = ApiService.getServerUrls();
      if (serverUrls.isNotEmpty) {
        await NetworkRepository.setHeaders(ApiService.getRequestHeaders(), serverUrls, token: accessToken);
      }
    }
  }

  await Store.put(StoreKey.version, targetVersion);
  return;
}
