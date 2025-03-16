import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/interfaces/user.interface.dart';
import 'package:immich_mobile/domain/interfaces/user_api.repository.dart';
import 'package:immich_mobile/domain/services/user.service.dart';
import 'package:immich_mobile/infrastructure/repositories/user.repository.dart';
import 'package:immich_mobile/infrastructure/repositories/user_api.repository.dart';
import 'package:immich_mobile/providers/api.provider.dart';
import 'package:immich_mobile/providers/infrastructure/db.provider.dart';
import 'package:immich_mobile/providers/infrastructure/store.provider.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'user.provider.g.dart';

@Riverpod(keepAlive: true)
IUserRepository userRepository(Ref ref) =>
    IsarUserRepository(ref.watch(isarProvider));

@Riverpod(keepAlive: true)
IUserApiRepository userApiRepository(Ref ref) =>
    UserApiRepository(ref.watch(apiServiceProvider).usersApi);

@Riverpod(keepAlive: true)
UserService userService(Ref ref) => UserService(
      userRepository: ref.watch(userRepositoryProvider),
      userApiRepository: ref.watch(userApiRepositoryProvider),
      storeService: ref.watch(storeServiceProvider),
    );
