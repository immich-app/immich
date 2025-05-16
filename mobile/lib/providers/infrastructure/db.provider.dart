import 'dart:async';

import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/infrastructure/repositories/db.repository.dart';
import 'package:isar/isar.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'db.provider.g.dart';

@Riverpod(keepAlive: true)
Isar isar(Ref ref) => throw UnimplementedError('isar');

final driftProvider = Provider<Drift>((ref) {
  final drift = Drift();
  ref.onDispose(() => unawaited(drift.close()));
  return drift;
});
