import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/services/partner.service.dart';
import 'package:immich_mobile/domain/services/user.service.dart';
import 'package:immich_mobile/infrastructure/repositories/partner.repository.dart';
import 'package:immich_mobile/infrastructure/repositories/user.repository.dart';
import 'package:immich_mobile/infrastructure/repositories/user_api.repository.dart';
import 'package:immich_mobile/providers/api.provider.dart';
import 'package:immich_mobile/providers/infrastructure/db.provider.dart';
import 'package:immich_mobile/providers/infrastructure/store.provider.dart';
import 'package:immich_mobile/repositories/partner_api.repository.dart';

final userRepositoryProvider = Provider((ref) => UserRepository(ref.watch(driftProvider)));

final userApiRepositoryProvider = Provider((ref) => UserApiRepository(ref.watch(apiServiceProvider).usersApi));

final userServiceProvider = Provider(
  (ref) => UserService(
    userApiRepository: ref.watch(userApiRepositoryProvider),
    storeService: ref.watch(storeServiceProvider),
  ),
);

final partnerRepositoryProvider = Provider<PartnerRepository>((ref) => PartnerRepository(ref.watch(driftProvider)));

final partnerServiceProvider = Provider<PartnerService>(
  (ref) => PartnerService(
    ref.watch(userRepositoryProvider),
    ref.watch(partnerRepositoryProvider),
    ref.watch(partnerApiRepositoryProvider),
  ),
);
