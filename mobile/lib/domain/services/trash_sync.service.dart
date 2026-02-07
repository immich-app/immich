import 'package:immich_mobile/infrastructure/repositories/trash_sync.repository.dart';

class TrashSyncService {
  final DriftTrashSyncRepository _trashSyncRepository;

  const TrashSyncService({required DriftTrashSyncRepository trashSyncRepository})
    : _trashSyncRepository = trashSyncRepository;

  Stream<int> watchPendingApprovalAssetCount() => _trashSyncRepository.watchPendingApprovalAssetCount();

  Stream<bool> watchIsAssetApprovalPending(String checksum) =>
      _trashSyncRepository.watchIsAssetApprovalPending(checksum);
}
