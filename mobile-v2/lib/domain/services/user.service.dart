import 'package:immich_mobile/domain/models/user.model.dart';
import 'package:immich_mobile/utils/immich_api_client.dart';
import 'package:immich_mobile/utils/mixins/log_context.mixin.dart';
import 'package:openapi/api.dart';

class UserService with LogContext {
  final ImmichApiClient _api;

  UsersApi get _userApi => _api.getUsersApi();

  UserService(this._api);

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
      log.severe("Error while fetching server features", e, s);
    }
    return null;
  }
}
