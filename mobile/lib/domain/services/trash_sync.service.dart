import 'package:immich_mobile/infrastructure/repositories/trash_sync.repository.dart';

class TrashSyncService {
  final DriftTrashSyncRepository _trashSyncRepository;

  const TrashSyncService({required DriftTrashSyncRepository trashSyncRepository})
    : _trashSyncRepository = trashSyncRepository;

  Stream<int> watchPendingApprovalCount() => _trashSyncRepository.watchPendingApprovalCount();

  Stream<bool> watchIsApprovalPending(String checksum) => _trashSyncRepository.watchIsApprovalPending(checksum);
}
