import 'package:immich_mobile/infrastructure/repositories/trash_sync.repository.dart';

class TrashSyncService {
  final DriftTrashSyncRepository _trashSyncRepository;

  TrashSyncService({required DriftTrashSyncRepository trashSyncRepository})
    : _trashSyncRepository = trashSyncRepository;

  Stream<int> watchPendingApprovalCount() => _trashSyncRepository.watchPendingApprovalCount();

  Stream<Set<String>> watchPendingApprovalChecksums() => _trashSyncRepository.watchPendingApprovalChecksums();

  Stream<bool> watchIsApprovalPending(String checksum) => _trashSyncRepository.watchIsApprovalPending(checksum);
}
