import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_data/model/person.dart';
import 'package:immich_mobile/providers/infrastructure/data_store.dart';
import 'package:immich_mobile/providers/infrastructure/user_metadata.provider.dart';

final driftPeopleAssetProvider = FutureProvider.family<List<Person>, String>((ref, assetId) async {
  final service = ref.watch(Store.people);
  return service.getAssetPeople(assetId);
});

final driftGetAllPeopleProvider = FutureProvider<List<Person>>((ref) async {
  final service = ref.watch(Store.people);
  final prefs = await ref.watch(userMetadataPreferencesProvider.future);
  return service.getAllPeopleFromDb(minFaces: prefs?.minimumFaces ?? 3);
});
