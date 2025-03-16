import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/user.model.dart';
import 'package:immich_mobile/providers/user.provider.dart';
import 'package:mocktail/mocktail.dart';

class MockCurrentUserProvider extends StateNotifier<UserDto?>
    with Mock
    implements CurrentUserProvider {
  MockCurrentUserProvider() : super(null);

  @override
  set state(UserDto? user) => super.state = user;
}
