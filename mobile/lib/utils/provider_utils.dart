import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/providers/infrastructure/search.provider.dart';
import 'package:immich_mobile/providers/infrastructure/user.provider.dart';
import 'package:immich_mobile/repositories/asset_api.repository.dart';
import 'package:immich_mobile/repositories/drift_album_api_repository.dart';
import 'package:immich_mobile/repositories/partner_api.repository.dart';

void invalidateAllApiRepositoryProviders(WidgetRef ref) {
  ref.invalidate(userApiRepositoryProvider);
  ref.invalidate(partnerApiRepositoryProvider);
  ref.invalidate(assetApiRepositoryProvider);
  ref.invalidate(searchApiRepositoryProvider);

  // `immich_data` repositories self invalidate

  // Drift
  ref.invalidate(driftAlbumApiRepositoryProvider);
}
