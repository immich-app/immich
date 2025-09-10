import 'dart:async';

import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/infrastructure/repositories/db.repository.dart';
import 'package:isar/isar.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'db.provider.g.dart';

@Riverpod(keepAlive: true)
Isar isar(Ref ref) => throw UnimplementedError('isar');

Drift Function(Ref ref) driftOverride(Drift drift) => (ref) {
  ref.onDispose(() => unawaited(drift.close()));
  ref.keepAlive();
  return drift;
};

final driftProvider = Provider<Drift>(
  (ref) => throw UnimplementedError("driftProvider must be overridden in the isolate's ProviderContainer before use"),
);
