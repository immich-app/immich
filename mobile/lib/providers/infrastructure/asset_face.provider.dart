import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/infrastructure/repositories/asset_face.repository.dart';
import 'package:immich_mobile/providers/infrastructure/db.provider.dart';

final driftAssetFaceProvider = Provider<DriftAssetFaceRepository>(
  (ref) => DriftAssetFaceRepository(ref.watch(driftProvider)),
);
