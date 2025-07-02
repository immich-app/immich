import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/infrastructure/repositories/exif.repository.dart';
import 'package:immich_mobile/providers/infrastructure/db.provider.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'exif.provider.g.dart';

@Riverpod(keepAlive: true)
IsarExifRepository exifRepository(Ref ref) =>
    IsarExifRepository(ref.watch(isarProvider));
