import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/services/user.service.dart';
import 'package:immich_mobile/providers/infrastructure/user.provider.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'user.provider.g.dart';

@riverpod
UserService userService(Ref ref) =>
    UserService(userRepo: ref.watch(userRepoProvider));
