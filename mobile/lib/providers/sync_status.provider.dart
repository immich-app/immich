import 'package:hooks_riverpod/hooks_riverpod.dart';

enum SyncStatus {
  idle,
  syncing,
  success,
  error,
}

class SyncStatusState {
  final SyncStatus remoteSyncStatus;
  final String? errorMessage;

  const SyncStatusState({
    this.remoteSyncStatus = SyncStatus.idle,
    this.errorMessage,
  });

  SyncStatusState copyWith({
    SyncStatus? remoteSyncStatus,
    String? errorMessage,
  }) {
    return SyncStatusState(
      remoteSyncStatus: remoteSyncStatus ?? this.remoteSyncStatus,
      errorMessage: errorMessage ?? this.errorMessage,
    );
  }

  bool get isRemoteSyncing => remoteSyncStatus == SyncStatus.syncing;

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    return other is SyncStatusState &&
        other.remoteSyncStatus == remoteSyncStatus &&
        other.errorMessage == errorMessage;
  }

  @override
  int get hashCode => Object.hash(remoteSyncStatus, errorMessage);
}

class SyncStatusNotifier extends StateNotifier<SyncStatusState> {
  SyncStatusNotifier() : super(const SyncStatusState());

  void setRemoteSyncStatus(SyncStatus status, [String? errorMessage]) {
    state = state.copyWith(
      remoteSyncStatus: status,
      errorMessage: status == SyncStatus.error ? errorMessage : null,
    );
  }

  void startRemoteSync() => setRemoteSyncStatus(SyncStatus.syncing);
  void completeRemoteSync() => setRemoteSyncStatus(SyncStatus.success);
  void errorRemoteSync(String error) =>
      setRemoteSyncStatus(SyncStatus.error, error);
}

final syncStatusProvider =
    StateNotifierProvider<SyncStatusNotifier, SyncStatusState>((ref) {
  return SyncStatusNotifier();
});
