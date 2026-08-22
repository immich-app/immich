import 'dart:async';

import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/user.model.dart';
import 'package:immich_mobile/providers/infrastructure/user.provider.dart';

final _userStreamProvider = StreamProvider<UserDto?>((ref) => ref.watch(userServiceProvider).watchMyUser());

class CurrentUserProvider extends Notifier<UserDto?> {
  @override
  UserDto? build() => ref.watch(_userStreamProvider).valueOrNull;

  Future<void> refresh() async {
    try {
      await ref.read(userServiceProvider).refreshMyUser();
    } catch (_) {}
  }
}

final currentUserProvider = NotifierProvider<CurrentUserProvider, UserDto?>(CurrentUserProvider.new);

final authUserProvider = Provider<UserDto>((ref) {
  final user = ref.watch(currentUserProvider);
  if (user == null) {
    throw Exception('User must be logged in to access this provider');
  }
  return user;
});
