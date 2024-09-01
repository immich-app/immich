import 'package:immich_mobile/domain/models/user.model.dart';
import 'package:immich_mobile/utils/mixins/log_context.mixin.dart';
import 'package:openapi/api.dart';

class UserService with LogContext {
  final UsersApi _userApi;

  const UserService(this._userApi);

  Future<User?> getMyUser() async {
    try {
      final userDto = await _userApi.getMyUser();
      if (userDto == null) {
        log.severe("Cannot fetch my user.");
        return null;
      }

      final preferencesDto = await _userApi.getMyPreferences();
      return User.fromAdminDto(userDto, preferencesDto);
    } catch (e, s) {
      log.severe("Error while fetching my user", e, s);
    }
    return null;
  }
}
