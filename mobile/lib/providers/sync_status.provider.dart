import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/foundation.dart';
import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';

part 'sync_status.provider.freezed.dart';

enum SyncStatus {
  idle,
  syncing,
  success,
  error;

  String localized() {
    return switch (this) {
      SyncStatus.idle => "idle".tr(),
      SyncStatus.syncing => "running".tr(),
      SyncStatus.success => "success".tr(),
      SyncStatus.error => "error".tr(),
    };
  }
}

@freezed
abstract class SyncStatusState with _$SyncStatusState {
  const SyncStatusState._();

  const factory SyncStatusState({
    @Default(SyncStatus.idle) SyncStatus remoteSyncStatus,
    @Default(SyncStatus.idle) SyncStatus localSyncStatus,
    @Default(SyncStatus.idle) SyncStatus hashJobStatus,
    @Default(SyncStatus.idle) SyncStatus cloudIdSyncStatus,
    String? errorMessage,
  }) = _SyncStatusState;

  bool get isRemoteSyncing => remoteSyncStatus == SyncStatus.syncing;
  bool get isLocalSyncing => localSyncStatus == SyncStatus.syncing;
  bool get isHashing => hashJobStatus == SyncStatus.syncing;
  bool get isCloudIdSyncing => cloudIdSyncStatus == SyncStatus.syncing;
}

class SyncStatusNotifier extends Notifier<SyncStatusState> {
  @override
  SyncStatusState build() {
    return const SyncStatusState(
      errorMessage: null,
      remoteSyncStatus: SyncStatus.idle,
      localSyncStatus: SyncStatus.idle,
      hashJobStatus: SyncStatus.idle,
      cloudIdSyncStatus: SyncStatus.idle,
    );
  }

  ///
  /// Remote Sync
  ///

  void setRemoteSyncStatus(SyncStatus status, [String? errorMessage]) {
    // TODO(agg23): These error messages probably should be cleared, not preserved on null
    state = state.copyWith(
      remoteSyncStatus: status,
      errorMessage: (status == SyncStatus.error ? errorMessage : null) ?? state.errorMessage,
    );
  }

  void startRemoteSync() => setRemoteSyncStatus(SyncStatus.syncing);
  void completeRemoteSync() => setRemoteSyncStatus(SyncStatus.success);
  void errorRemoteSync(String error) => setRemoteSyncStatus(SyncStatus.error, error);

  ///
  /// Local Sync
  ///

  void setLocalSyncStatus(SyncStatus status, [String? errorMessage]) {
    // TODO(agg23): These error messages probably should be cleared, not preserved on null
    state = state.copyWith(
      localSyncStatus: status,
      errorMessage: (status == SyncStatus.error ? errorMessage : null) ?? state.errorMessage,
    );
  }

  void startLocalSync() => setLocalSyncStatus(SyncStatus.syncing);
  void completeLocalSync() => setLocalSyncStatus(SyncStatus.success);
  void errorLocalSync(String error) => setLocalSyncStatus(SyncStatus.error, error);

  ///
  /// Hash Job
  ///

  void setHashJobStatus(SyncStatus status, [String? errorMessage]) {
    // TODO(agg23): These error messages probably should be cleared, not preserved on null
    state = state.copyWith(
      hashJobStatus: status,
      errorMessage: (status == SyncStatus.error ? errorMessage : null) ?? state.errorMessage,
    );
  }

  void startHashJob() => setHashJobStatus(SyncStatus.syncing);
  void completeHashJob() => setHashJobStatus(SyncStatus.success);
  void errorHashJob(String error) => setHashJobStatus(SyncStatus.error, error);

  ///
  /// Cloud ID Sync Job
  ///

  void setCloudIdSyncStatus(SyncStatus status, [String? errorMessage]) {
    // TODO(agg23): These error messages probably should be cleared, not preserved on null
    state = state.copyWith(
      cloudIdSyncStatus: status,
      errorMessage: (status == SyncStatus.error ? errorMessage : null) ?? state.errorMessage,
    );
  }

  void startCloudIdSync() => setCloudIdSyncStatus(SyncStatus.syncing);
  void completeCloudIdSync() => setCloudIdSyncStatus(SyncStatus.success);
  void errorCloudIdSync(String error) => setCloudIdSyncStatus(SyncStatus.error, error);
}

final syncStatusProvider = NotifierProvider<SyncStatusNotifier, SyncStatusState>(SyncStatusNotifier.new);
