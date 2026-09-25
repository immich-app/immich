import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/providers/infrastructure/search.provider.dart';
import 'package:immich_mobile/providers/infrastructure/user.provider.dart';
import 'package:immich_mobile/repositories/album_api_repository.dart';
import 'package:immich_mobile/repositories/asset_api.repository.dart';
import 'package:immich_mobile/repositories/partner_api.repository.dart';

void invalidateAllApiRepositoryProviders(WidgetRef ref) {
  // TODO(rewrite): This should all be unnecessary after auth was moved to the native HTTP clients. Left here to be incrementally removed as these providers are encountered/touched
  ref.invalidate(userApiRepositoryProvider);
  ref.invalidate(partnerApiRepositoryProvider);
  ref.invalidate(assetApiRepositoryProvider);
  ref.invalidate(searchApiRepositoryProvider);

  // Drift
  ref.invalidate(albumApiRepositoryProvider);
}
