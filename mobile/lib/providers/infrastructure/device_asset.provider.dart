import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/infrastructure/repositories/device_asset.repository.dart';
import 'package:immich_mobile/providers/infrastructure/db.provider.dart';

final deviceAssetRepositoryProvider = Provider<IsarDeviceAssetRepository>(
  (ref) => IsarDeviceAssetRepository(ref.watch(isarProvider)),
);
