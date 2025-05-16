import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/interfaces/exif.interface.dart';
import 'package:immich_mobile/infrastructure/repositories/exif.repository.dart';
import 'package:immich_mobile/providers/infrastructure/db.provider.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'exif.provider.g.dart';

@Riverpod(keepAlive: true)
IExifInfoRepository exifRepository(Ref ref) =>
    IsarExifRepository(ref.watch(isarProvider));
