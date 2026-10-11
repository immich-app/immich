import 'package:flutter_test/flutter_test.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/asset_edit.model.dart';
import 'package:immich_mobile/domain/models/exif.model.dart';
import 'package:immich_mobile/presentation/pages/edit/editor.provider.dart';
import 'package:openapi/api.dart';

void main() {
  test('maps native crop coordinates against the published Lightroom base without reapplying source orientation', () {
    final container = ProviderContainer();
    addTearDown(container.dispose);
    final crop = CropEdit(CropParameters(x: 300, y: 200, width: 1500, height: 1000));

    container
        .read(editorStateProvider.notifier)
        .init(
          [crop],
          const ExifInfo(width: 6000, height: 4000, isFlipped: true),
          baseDimensions: (width: 3000, height: 2000),
        );

    final state = container.read(editorStateProvider);
    expect(state.originalWidth, 3000);
    expect(state.originalHeight, 2000);
    expect(state.crop.left, closeTo(0.1, 0.00001));
    expect(state.crop.top, closeTo(0.1, 0.00001));
    expect(state.crop.width, closeTo(0.5, 0.00001));
    expect(state.crop.height, closeTo(0.5, 0.00001));
  });

  test('retains oriented source dimensions when an older server has no published base', () {
    final container = ProviderContainer();
    addTearDown(container.dispose);

    container.read(editorStateProvider.notifier).init([], const ExifInfo(width: 6000, height: 4000, isFlipped: true));

    final state = container.read(editorStateProvider);
    expect(state.originalWidth, 4000);
    expect(state.originalHeight, 6000);
  });
}
