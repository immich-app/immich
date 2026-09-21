import 'package:collection/collection.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/data/store/util/cache.dart';
import 'package:immich_mobile/domain/models/user_metadata.model.dart';
import 'package:immich_mobile/providers/infrastructure/db.provider.dart';
// TODO(rewrite): Remove once the current user is a store entry of its own
import 'package:immich_mobile/providers/user.provider.dart';

/// Server held metadata about the current user; their preferences, onboarding state and license
///
/// State is stored in the local DB, and is only written by server sync
extension type const UserMetadataStore._(Provider<UserMetadataMutations> _provider)
    implements Provider<UserMetadataMutations> {
  static final UserMetadataStore instance = UserMetadataStore._(Provider((ref) => UserMetadataMutations._(ref)));

  /// The current user's server side preferences, or `null` if they have not synced yet
  ///
  /// **NOTE:** This is only reactive to the local DB
  StreamProvider<Preferences?> preferences() => _preferencesProvider;
}

final _preferencesProvider = StreamProvider<Preferences?>((ref) {
  final userId = ref.watch(currentUserProvider.select((user) => user?.id));
  if (userId == null) {
    return Stream.value(null);
  }

  final repository = driftProvider.select((db) => db.userMetadataRepository);
  return ref
      .watch(repository)
      .watchUserMetadata(userId)
      .map((metadataList) => metadataList.firstWhereOrNull((metadata) => metadata.preferences != null)?.preferences);
});

class UserMetadataMutations extends StoreMutations {
  const UserMetadataMutations._(super.ref);
}
