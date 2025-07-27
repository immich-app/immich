import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/person.model.dart';
import 'package:immich_mobile/domain/services/people.service.dart';
import 'package:immich_mobile/infrastructure/repositories/person.repository.dart';
import 'package:immich_mobile/providers/infrastructure/db.provider.dart';

final driftPeopleRepositoryProvider = Provider<DriftPeopleRepository>(
  (ref) => DriftPeopleRepository(ref.watch(driftProvider)),
);

final driftPeopleServiceProvider = Provider<DriftPeopleService>(
  (ref) => DriftPeopleService(ref.watch(driftPeopleRepositoryProvider)),
);

final driftPeopleAssetProvider = FutureProvider.family<List<DriftPeople>, String>(
  (ref, assetId) async {
    final peopleService = ref.watch(driftPeopleServiceProvider);
    return peopleService.getAssetPeople(assetId);
  },
);

final driftGetAllPeopleProvider = FutureProvider<List<DriftPeople>>(
  (ref) async {
    final peopleService = ref.watch(driftPeopleServiceProvider);
    return peopleService.getAllPeople();
  },
);
