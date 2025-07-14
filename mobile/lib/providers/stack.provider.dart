import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/infrastructure/repositories/stack.repository.dart';
import 'package:immich_mobile/providers/infrastructure/db.provider.dart';

final driftStackProvider = Provider<DriftStackRepository>(
  (ref) => DriftStackRepository(ref.watch(driftProvider)),
);
