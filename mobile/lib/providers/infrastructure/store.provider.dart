import 'package:immich_mobile/domain/interfaces/store.interface.dart';
import 'package:immich_mobile/infrastructure/repositories/store.repository.dart';
import 'package:immich_mobile/providers/infrastructure/db.provider.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'store.provider.g.dart';

@riverpod
IStoreRepository storeRepository(StoreRepositoryRef ref) =>
    IsarStoreRepository(ref.watch(isarProvider));
