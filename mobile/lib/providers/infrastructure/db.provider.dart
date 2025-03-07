import 'package:immich_mobile/infrastructure/repositories/db.repository.dart';
import 'package:isar/isar.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'db.provider.g.dart';

@Riverpod(keepAlive: true)
Isar isar(IsarRef ref) => throw UnimplementedError('isar');

@Riverpod(keepAlive: true)
Drift drift(DriftRef _) => Drift();
