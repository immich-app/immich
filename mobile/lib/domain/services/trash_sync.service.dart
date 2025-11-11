import 'package:immich_mobile/domain/models/trash_sync.model.dart';
import 'package:immich_mobile/infrastructure/repositories/trash_sync.repository.dart';

typedef ReviewItem = ({String localAssetId, String checksum});

class TrashSyncService {
  final DriftTrashSyncRepository _trashSyncRepository;

  TrashSyncService({required DriftTrashSyncRepository trashSyncRepository})
    : _trashSyncRepository = trashSyncRepository;

  Stream<int> watchPendingApprovalCount({TrashActionType? actionType}) =>
      _trashSyncRepository.watchPendingApprovalCount(actionType);

  Stream<Set<String>> watchPendingApprovalChecksums() => _trashSyncRepository.watchPendingApprovalChecksums();
}
