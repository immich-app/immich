import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/infrastructure/repositories/local_asset.repository.dart';
import 'package:immich_mobile/providers/infrastructure/db.provider.dart';

final localAssetRepository = Provider<DriftLocalAssetRepository>(
  (ref) => DriftLocalAssetRepository(ref.watch(driftProvider)),
);
