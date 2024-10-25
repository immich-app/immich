import 'package:openapi/api.dart';

abstract interface class ISyncApiRepository {
  Stream<Map<SyncStreamDtoTypesEnum, dynamic>> getChanges(
    List<SyncStreamDtoTypesEnum> types,
  );
  Future<void> confirmChages(String changeId);
}
