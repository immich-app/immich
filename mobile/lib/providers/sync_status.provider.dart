import 'package:easy_localization/easy_localization.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';

enum SyncStatus {
  idle,
  syncing,
  success,
  error;

  localized() {
    return switch (this) {
      SyncStatus.idle => "idle".tr(),
      SyncStatus.syncing => "running".tr(),
      SyncStatus.success => "success".tr(),
      SyncStatus.error => "error".tr()
    };
  }
}

class SyncStatusState {
  final SyncStatus remoteSyncStatus;
  final SyncStatus localSyncStatus;
  final SyncStatus hashJobStatus;

  final String? errorMessage;

  const SyncStatusState({
    this.remoteSyncStatus = SyncStatus.idle,
    this.localSyncStatus = SyncStatus.idle,
    this.hashJobStatus = SyncStatus.idle,
    this.errorMessage,
  });

  SyncStatusState copyWith({
    SyncStatus? remoteSyncStatus,
    SyncStatus? localSyncStatus,
    SyncStatus? hashJobStatus,
    String? errorMessage,
  }) {
    return SyncStatusState(
      remoteSyncStatus: remoteSyncStatus ?? this.remoteSyncStatus,
      localSyncStatus: localSyncStatus ?? this.localSyncStatus,
      hashJobStatus: hashJobStatus ?? this.hashJobStatus,
      errorMessage: errorMessage ?? this.errorMessage,
    );
  }

  bool get isRemoteSyncing => remoteSyncStatus == SyncStatus.syncing;
  bool get isLocalSyncing => localSyncStatus == SyncStatus.syncing;
  bool get isHashing => hashJobStatus == SyncStatus.syncing;

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    return other is SyncStatusState &&
        other.remoteSyncStatus == remoteSyncStatus &&
        other.localSyncStatus == localSyncStatus &&
        other.hashJobStatus == hashJobStatus &&
        other.errorMessage == errorMessage;
  }

  @override
  int get hashCode => Object.hash(
        remoteSyncStatus,
        localSyncStatus,
        hashJobStatus,
        errorMessage,
      );
}

class SyncStatusNotifier extends Notifier<SyncStatusState> {
  @override
  SyncStatusState build() {
    return const SyncStatusState(
      errorMessage: null,
      remoteSyncStatus: SyncStatus.idle,
      localSyncStatus: SyncStatus.idle,
      hashJobStatus: SyncStatus.idle,
    );
  }

  ///
  /// Remote Sync
  ///

  void setRemoteSyncStatus(SyncStatus status, [String? errorMessage]) {
    state = state.copyWith(
      remoteSyncStatus: status,
      errorMessage: status == SyncStatus.error ? errorMessage : null,
    );
  }

  void startRemoteSync() => setRemoteSyncStatus(SyncStatus.syncing);
  void completeRemoteSync() => setRemoteSyncStatus(SyncStatus.success);
  void errorRemoteSync(String error) => setRemoteSyncStatus(SyncStatus.error, error);

  ///
  /// Local Sync
  ///

  void setLocalSyncStatus(SyncStatus status, [String? errorMessage]) {
    state = state.copyWith(
      localSyncStatus: status,
      errorMessage: status == SyncStatus.error ? errorMessage : null,
    );
  }

  void startLocalSync() => setLocalSyncStatus(SyncStatus.syncing);
  void completeLocalSync() => setLocalSyncStatus(SyncStatus.success);
  void errorLocalSync(String error) => setLocalSyncStatus(SyncStatus.error, error);

  ///
  /// Hash Job
  ///

  void setHashJobStatus(SyncStatus status, [String? errorMessage]) {
    state = state.copyWith(
      hashJobStatus: status,
      errorMessage: status == SyncStatus.error ? errorMessage : null,
    );
  }

  void startHashJob() => setHashJobStatus(SyncStatus.syncing);
  void completeHashJob() => setHashJobStatus(SyncStatus.success);
  void errorHashJob(String error) => setHashJobStatus(SyncStatus.error, error);
}

final syncStatusProvider = NotifierProvider<SyncStatusNotifier, SyncStatusState>(
  SyncStatusNotifier.new,
);
