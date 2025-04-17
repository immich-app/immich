import 'package:immich_mobile/domain/interfaces/db.interface.dart';
import 'package:openapi/api.dart';

abstract interface class ISyncStreamRepository implements IDatabaseRepository {
  Future<bool> updateUsersV1(Iterable<SyncUserV1> data);
  Future<bool> deleteUsersV1(Iterable<SyncUserDeleteV1> data);

  Future<bool> updatePartnerV1(Iterable<SyncPartnerV1> data);
  Future<bool> deletePartnerV1(Iterable<SyncPartnerDeleteV1> data);
}
