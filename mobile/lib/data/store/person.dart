import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/data/db/main/dao/person.dart';
import 'package:immich_mobile/data/server/person.dart';
import 'package:immich_mobile/data/store/util/cache.dart';
import 'package:immich_mobile/domain/models/person.model.dart';
import 'package:immich_mobile/providers/infrastructure/db.provider.dart';
// TODO(rewrite): Remove once user metadata is a store entry of its own
import 'package:immich_mobile/providers/infrastructure/user_metadata.provider.dart';

/// People representing collections of faces and assets
///
/// State is stored in the local DB, while mutations are pushed to both HTTP and DB
extension type const PersonStore._(Provider<PersonMutations> _provider) implements Provider<PersonMutations> {
  /// Internal: access through `Store.people`
  static final PersonStore instance = PersonStore._(Provider((ref) => PersonMutations._(ref)));

  /// Get the person specified by [personId]
  ///
  /// **NOTE:** This is not reactive to changes, and only hits the local DB
  AutoDisposeFutureProvider<Person?> byId(String personId) => _byIdProvider(personId);

  /// Get the people present in the asset [assetId]
  ///
  /// **NOTE:** This is not reactive to changes, and only hits the local DB
  AutoDisposeFutureProvider<List<Person>> forAsset(String assetId) => _forAssetProvider(assetId);

  /// Get all known people, honoring the user's minimum detected face count preference
  ///
  /// **NOTE:** This only hits the local DB
  AutoDisposeStreamProvider<List<Person>> all() => _allProvider;
}

final _peopleDb = Provider((ref) => PeopleDbRepository(ref.watch(driftProvider)));

// We have to map from non-reactive existing Drift queries to Riverpod reactivity, so we wrap each call in a provider family
// Note that the only reactivity here is in going from no data (fetch start) to data (fetch completed), and the DB swapping (basically never)
final _byIdProvider = FutureProvider.autoDispose.family<Person?, String>(
  (ref, personId) => ref.watch(_peopleDb).get(personId),
);

final _forAssetProvider = FutureProvider.autoDispose.family<List<Person>, String>(
  (ref, assetId) => ref.watch(_peopleDb).getAssetPeople(assetId),
);

final _allProvider = StreamProvider.autoDispose<List<Person>>((ref) async* {
  final prefs = await ref.watch(userMetadataPreferencesProvider.future);
  yield* ref.watch(_peopleDb).watch(minFaces: prefs?.minimumFaces ?? 3);
});

class PersonMutations extends StoreMutations {
  const PersonMutations._(super.ref);

  /// Update a person's name
  Future<int> updateName(String personId, String name) async {
    await read(personApiRepositoryProvider).update(personId, name: name);
    return read(_peopleDb).updateName(personId, name);
  }

  /// Update a person's birthday
  Future<int> updateBirthday(String personId, DateTime birthday) async {
    await read(personApiRepositoryProvider).update(personId, birthday: birthday);
    return read(_peopleDb).updateBirthday(personId, birthday);
  }
}
