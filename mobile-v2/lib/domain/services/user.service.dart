import 'package:immich_mobile/domain/models/user.model.dart';
import 'package:immich_mobile/utils/mixins/log.mixin.dart';
import 'package:openapi/api.dart';

class UserService with LogMixin {
  final UsersApi _userApi;

  const UserService(this._userApi);

  Future<User?> getMyUser() async {
    try {
      final [
        userDto as UserAdminResponseDto?,
        preferencesDto as UserPreferencesResponseDto?
      ] = await Future.wait([
        _userApi.getMyUser(),
        _userApi.getMyPreferences(),
      ]);

      if (userDto == null) {
        log.e("Cannot fetch my user.");
        return null;
      }

      return User.fromAdminDto(userDto, preferencesDto);
    } catch (e, s) {
      log.e("Error while fetching my user", e, s);
    }
    return null;
  }
}
