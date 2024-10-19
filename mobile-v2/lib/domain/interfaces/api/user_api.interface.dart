import 'package:immich_mobile/domain/models/user.model.dart';

abstract interface class IUserApiRepository {
  /// Fetches the current users meta data
  Future<User?> getMyUser();
}
