import 'package:immich_mobile/interfaces/database.interface.dart';

abstract interface class IAuthRepository implements IDatabaseRepository {
  Future<void> clearLocalData();
  String getAccessToken();
}
