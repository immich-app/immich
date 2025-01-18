import 'dart:async';

import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/services/auth.service.dart';
import 'package:immich_mobile/providers/infrastructure/store.provider.dart';
import 'package:immich_mobile/providers/infrastructure/user.provider.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'auth.provider.g.dart';

@Riverpod(keepAlive: true)
AuthService authService(Ref ref) {
  final auth = AuthService(
    storeRepo: ref.watch(storeRepoProvider),
    userRepo: ref.watch(userRepoProvider),
  );
  ref.onDispose(() => unawaited(auth.cleanup()));
  return auth;
}
