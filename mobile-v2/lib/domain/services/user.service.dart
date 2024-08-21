import 'package:immich_mobile/domain/models/user.model.dart';
import 'package:immich_mobile/utils/mixins/log_context.mixin.dart';
import 'package:openapi/openapi.dart';

class UserService with LogContext {
  final Openapi _api;

  UsersApi get _userApi => _api.getUsersApi();

  UserService(this._api);

  Future<User?> getMyUser() async {
    try {
      final response = await _userApi.getMyUser();
      final dto = response.data;
      if (dto == null) {
        log.severe("Cannot fetch my user.");
        return null;
      }

      final preferences = await _userApi.getMyPreferences();
      return User.fromAdminDto(dto, preferences.data);
    } catch (e, s) {
      log.severe("Error while fetching server features", e, s);
    }
    return null;
  }
}
