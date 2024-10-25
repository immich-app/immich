import 'package:openapi/api.dart';

abstract interface class ISyncApiRepository {
  Stream<List<Map<SyncStreamDtoTypesEnum, dynamic>>> getChanges(
    SyncStreamDtoTypesEnum type,
  );
  Future<void> confirmChages(String changeId);
}
