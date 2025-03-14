import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/infrastructure/repositories/db.repository.dart';
import 'package:isar/isar.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

// overwritten in main.dart due to async loading
final dbProvider = Provider<Isar>((_) => throw UnimplementedError());

@Riverpod(keepAlive: true)
Drift drift(Ref _) => Drift();
