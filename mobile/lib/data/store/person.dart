import 'package:collection/collection.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/data/server/person.dart';
import 'package:immich_mobile/data/store/user_metadata.dart';
import 'package:immich_mobile/data/store/util/cache.dart';
import 'package:immich_mobile/domain/models/person.model.dart';
import 'package:immich_mobile/providers/infrastructure/db.provider.dart';

/// People representing collections of faces and assets
///
/// State is stored in the local DB, while mutations are pushed to both HTTP and DB
extension type const PersonStore._(Provider<PersonMutations> _provider) implements Provider<PersonMutations> {
  /// Internal: access through `Store.people`
  static final PersonStore instance = PersonStore._(Provider((ref) => PersonMutations._(ref)));

  /// Get the person specified by [personId]
  ///
  /// **NOTE:** This is only reactive to the local DB
  AutoDisposeStreamProvider<Person?> byId(String personId) => _byIdProvider(personId);

  /// Get the people present in the asset [assetId]
  ///
  /// **NOTE:** This is only reactive to the local DB
  AutoDisposeStreamProvider<List<Person>> forAsset(String assetId) => _forAssetProvider(assetId);

  /// Get all known people, honoring the user's minimum detected face count preference
  ///
  /// **NOTE:** This only hits the local DB
  AutoDisposeStreamProvider<List<Person>> all() => _allProvider;
}

final _peopleDb = driftProvider.select((db) => db.peopleDatabaseRepository);

final _byIdProvider = StreamProvider.autoDispose.family<Person?, String>(
  (ref, personId) => ref.watch(_peopleDb).watchPerson(personId).distinct(),
);

final _forAssetProvider = StreamProvider.autoDispose.family<List<Person>, String>(
  (ref, assetId) => ref.watch(_peopleDb).watchPeopleForAsset(assetId).distinct(const ListEquality<Person>().equals),
);

final _allProvider = StreamProvider.autoDispose<List<Person>>((ref) async* {
  final prefs = await ref.watch(UserMetadataStore.instance.preferences().future);

  yield* ref
      .watch(_peopleDb)
      .watchAll(minFaces: prefs?.minimumFaces ?? 3)
      .distinct(const ListEquality<Person>().equals);
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
