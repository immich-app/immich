import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/interfaces/user.interface.dart';
import 'package:immich_mobile/infrastructure/repositories/user.repository.dart';
import 'package:immich_mobile/providers/infrastructure/database.provider.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'user.provider.g.dart';

@riverpod
IUserRepository userRepo(Ref ref) =>
    IsarUserRepository(ref.watch(isarProvider));
