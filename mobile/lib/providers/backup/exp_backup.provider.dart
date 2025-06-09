// ignore_for_file: public_member_api_docs, sort_constructors_first
import 'dart:convert';

import 'package:hooks_riverpod/hooks_riverpod.dart';

import 'package:immich_mobile/services/exp_backup.service.dart';

class ExpBackupState {
  final int totalCount;
  ExpBackupState({
    required this.totalCount,
  });

  ExpBackupState copyWith({
    int? totalCount,
  }) {
    return ExpBackupState(
      totalCount: totalCount ?? this.totalCount,
    );
  }

  Map<String, dynamic> toMap() {
    return <String, dynamic>{
      'totalCount': totalCount,
    };
  }

  factory ExpBackupState.fromMap(Map<String, dynamic> map) {
    return ExpBackupState(
      totalCount: map['totalCount'] as int,
    );
  }

  String toJson() => json.encode(toMap());

  factory ExpBackupState.fromJson(String source) =>
      ExpBackupState.fromMap(json.decode(source) as Map<String, dynamic>);

  @override
  String toString() => 'ExpBackupState(totalCount: $totalCount)';

  @override
  bool operator ==(covariant ExpBackupState other) {
    if (identical(this, other)) return true;

    return other.totalCount == totalCount;
  }

  @override
  int get hashCode => totalCount.hashCode;
}

final expBackupProvider =
    StateNotifierProvider<ExpBackupNotifier, ExpBackupState>((ref) {
  return ExpBackupNotifier(ref.watch(expBackupServiceProvider));
});

class ExpBackupNotifier extends StateNotifier<ExpBackupState> {
  ExpBackupNotifier(this._backupService)
      : super(
          ExpBackupState(
            totalCount: 0,
          ),
        );

  final ExpBackupService _backupService;

  Future<void> getBackupStatus() async {
    final totalCount = await _backupService.getTotalCount();

    state = state.copyWith(totalCount: totalCount);
  }
}
