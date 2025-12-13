import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/person.model.dart';
import 'package:immich_mobile/domain/services/people.service.dart';
import 'package:immich_mobile/infrastructure/repositories/people.repository.dart';
import 'package:immich_mobile/providers/infrastructure/db.provider.dart';
import 'package:immich_mobile/repositories/person_api.repository.dart';

final driftPeopleRepositoryProvider = Provider<DriftPeopleRepository>(
  (ref) => DriftPeopleRepository(ref.watch(driftProvider)),
);

final driftPeopleServiceProvider = Provider<DriftPeopleService>(
  (ref) => DriftPeopleService(ref.watch(driftPeopleRepositoryProvider), ref.watch(personApiRepositoryProvider)),
);

final driftPeopleAssetProvider = FutureProvider.family<List<DriftPerson>, String>((ref, assetId) async {
  final service = ref.watch(driftPeopleServiceProvider);
  return service.getAssetPeople(assetId);
});

final driftGetAllPeopleProvider = FutureProvider<List<DriftPerson>>((ref) async {
  final service = ref.watch(driftPeopleServiceProvider);
  return service.getAllPeople();
});
