import 'package:immich_mobile/domain/interfaces/db.interface.dart';
import 'package:openapi/api.dart';

abstract interface class ISyncStreamRepository implements IDatabaseRepository {
  Future<bool> updateUsersV1(SyncUserV1 data);
  Future<bool> deleteUsersV1(SyncUserDeleteV1 data);

  Future<bool> updatePartnerV1(SyncPartnerV1 data);
  Future<bool> deletePartnerV1(SyncPartnerDeleteV1 data);
}
