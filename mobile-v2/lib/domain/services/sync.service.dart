import 'dart:async';

import 'package:immich_mobile/domain/interfaces/asset.interface.dart';
import 'package:immich_mobile/domain/models/asset.model.dart';
import 'package:immich_mobile/domain/models/user.model.dart';
import 'package:immich_mobile/domain/repositories/database.repository.dart';
import 'package:immich_mobile/service_locator.dart';
import 'package:immich_mobile/utils/constants/globals.dart';
import 'package:immich_mobile/utils/immich_api_client.dart';
import 'package:immich_mobile/utils/isolate_helper.dart';
import 'package:immich_mobile/utils/mixins/log_context.mixin.dart';
import 'package:logging/logging.dart';
import 'package:openapi/api.dart';

class SyncService with LogContext {
  SyncService();

  Future<bool> doFullSyncForUserDrift(
    User user, {
    DateTime? updatedUtil,
    int? limit,
  }) async {
    return await IsolateHelper.run(() async {
      try {
        final logger = Logger("SyncService <Isolate>");
        final syncClient = di<ImmichApiClient>().getSyncApi();

        final chunkSize = limit ?? kFullSyncChunkSize;
        final updatedTill = updatedUtil ?? DateTime.now().toUtc();
        updatedUtil ??= DateTime.now().toUtc();
        String? lastAssetId;

        while (true) {
          logger.info(
            "Requesting more chunks from lastId - ${lastAssetId ?? "<initial_fetch>"}",
          );

          final assets = await syncClient.getFullSyncForUser(AssetFullSyncDto(
            limit: chunkSize,
            updatedUntil: updatedTill,
            lastId: lastAssetId,
            userId: user.id,
          ));
          if (assets == null) {
            break;
          }

          await di<IAssetRepository>().addAll(assets.map(Asset.remote));

          lastAssetId = assets.lastOrNull?.id;
          if (assets.length != chunkSize) break;
        }

        return true;
      } catch (e, s) {
        log.severe("Error performing full sync for user - ${user.name}", e, s);
      } finally {
        await di<DriftDatabaseRepository>().close();
      }
      return false;
    });
  }
}
