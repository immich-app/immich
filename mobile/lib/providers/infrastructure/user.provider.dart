import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/user.model.dart';
import 'package:immich_mobile/domain/services/partner.service.dart';
import 'package:immich_mobile/domain/services/user.service.dart';
import 'package:immich_mobile/infrastructure/repositories/partner.repository.dart';
import 'package:immich_mobile/infrastructure/repositories/user.repository.dart';
import 'package:immich_mobile/infrastructure/repositories/user_api.repository.dart';
import 'package:immich_mobile/providers/api.provider.dart';
import 'package:immich_mobile/providers/infrastructure/db.provider.dart';
import 'package:immich_mobile/providers/infrastructure/partner.provider.dart';
import 'package:immich_mobile/providers/infrastructure/store.provider.dart';
import 'package:immich_mobile/repositories/partner_api.repository.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'user.provider.g.dart';

@Riverpod(keepAlive: true)
IsarUserRepository userRepository(Ref ref) => IsarUserRepository(ref.watch(isarProvider));

@Riverpod(keepAlive: true)
UserApiRepository userApiRepository(Ref ref) => UserApiRepository(ref.watch(apiServiceProvider).usersApi);

@Riverpod(keepAlive: true)
UserService userService(Ref ref) => UserService(
      isarUserRepository: ref.watch(userRepositoryProvider),
      userApiRepository: ref.watch(userApiRepositoryProvider),
      storeService: ref.watch(storeServiceProvider),
    );

/// Drifts
final driftPartnerRepositoryProvider = Provider<DriftPartnerRepository>(
  (ref) => DriftPartnerRepository(ref.watch(driftProvider)),
);

final driftPartnerServiceProvider = Provider<DriftPartnerService>(
  (ref) => DriftPartnerService(
    ref.watch(driftPartnerRepositoryProvider),
    ref.watch(partnerApiRepositoryProvider),
  ),
);

final partnerUsersProvider = NotifierProvider<PartnerNotifier, List<PartnerUserDto>>(
  PartnerNotifier.new,
);
