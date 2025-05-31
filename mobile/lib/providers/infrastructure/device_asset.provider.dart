import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/interfaces/device_asset.interface.dart';
import 'package:immich_mobile/infrastructure/repositories/device_asset.repository.dart';
import 'package:immich_mobile/providers/infrastructure/db.provider.dart';

final deviceAssetRepositoryProvider = Provider<IDeviceAssetRepository>(
  (ref) => IsarDeviceAssetRepository(ref.watch(isarProvider)),
);

final assetHashRepositoryProvider = Provider<ILocalAssetHashRepository>(
  (ref) => DriftLocalAssetHashRepository(ref.watch(driftProvider)),
);
