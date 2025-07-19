import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/person.model.dart';
import 'package:immich_mobile/domain/services/person.service.dart';
import 'package:immich_mobile/infrastructure/repositories/person.repository.dart';
import 'package:immich_mobile/providers/infrastructure/db.provider.dart';

final driftPersonRepository = Provider<DriftPersonRepository>(
  (ref) => DriftPersonRepository(ref.watch(driftProvider)),
);

final driftPersonServiceProvider = Provider<PersonService>(
  (ref) => PersonService(ref.watch(driftPersonRepository)),
);

final personProvider = FutureProvider.family<List<Person>, String>(
  (ref, userId) =>
      PersonService(ref.watch(driftPersonRepository)).getAll(userId),
);
