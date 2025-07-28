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

class UpdateNamePayload {
  final String personId;
  final String newName;

  const UpdateNamePayload(this.personId, this.newName);
}

final driftUpdatePersonNameProvider = FutureProvider.family<int, UpdateNamePayload>((ref, payload) async {
  final service = ref.watch(driftPeopleServiceProvider);
  final changes = await service.updateName(payload.personId, payload.newName);
  ref.invalidate(driftGetAllPeopleProvider);

  return changes;
});

class UpdateBirthdayPayload {
  final String personId;
  final DateTime birthday;

  const UpdateBirthdayPayload(this.personId, this.birthday);
}

final driftUpdatePersonBirthdayProvider = FutureProvider.family<int, UpdateBirthdayPayload>((ref, payload) async {
  final service = ref.watch(driftPeopleServiceProvider);
  final changes = await service.updateBrithday(payload.personId, payload.birthday);
  ref.invalidate(driftGetAllPeopleProvider);

  return changes;
});
