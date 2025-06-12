import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/interfaces/local_asset.interface.dart';
import 'package:immich_mobile/domain/interfaces/remote_asset.interface.dart';
import 'package:immich_mobile/domain/interfaces/asset_api.interface.dart';
import 'package:immich_mobile/domain/services/asset.service.dart';
import 'package:immich_mobile/infrastructure/repositories/local_asset.repository.dart';
import 'package:immich_mobile/infrastructure/repositories/remote_asset.repository.dart';
import 'package:immich_mobile/infrastructure/repositories/asset_api.repository.dart';
import 'package:immich_mobile/providers/api.provider.dart';
import 'package:immich_mobile/providers/infrastructure/db.provider.dart';

final localAssetRepositoryProvider = Provider<ILocalAssetRepository>(
  (ref) => DriftLocalAssetRepository(ref.watch(driftProvider)),
);

final remoteAssetRepositoryProvider = Provider<IRemoteAssetRepository>(
  (ref) => DriftRemoteAssetRepository(ref.watch(driftProvider)),
);

final assetApiRepositoryProvider = Provider<IAssetApiRepository>(
  (ref) => AssetApiRepository(ref.watch(apiServiceProvider)),
);

final assetServiceProvider = Provider<AssetService>(
  (ref) => AssetService(
    localAssetRepository: ref.watch(localAssetRepositoryProvider),
    remoteAssetRepository: ref.watch(remoteAssetRepositoryProvider),
    assetApiRepository: ref.watch(assetApiRepositoryProvider),
  ),
);
