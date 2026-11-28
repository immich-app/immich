import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/domain/models/asset_edit.model.dart';
import 'package:immich_mobile/domain/models/exif.model.dart';
import 'package:immich_mobile/domain/models/ocr.model.dart';
import 'package:immich_mobile/utils/editor.utils.dart';
import 'package:openapi/api.dart' show CropParameters, MirrorAxis, MirrorParameters, RotateParameters;

List<AssetEdit> normalizedToEdits(NormalizedTransform transform) {
  final List<AssetEdit> edits = [];

  if (transform.mirrorHorizontal) {
    edits.add(MirrorEdit(MirrorParameters(axis: MirrorAxis.horizontal)));
  }

  if (transform.mirrorVertical) {
    edits.add(MirrorEdit(MirrorParameters(axis: MirrorAxis.vertical)));
  }

  if (transform.rotation != 0) {
    edits.add(RotateEdit(RotateParameters(angle: transform.rotation)));
  }

  return edits;
}

bool compareEditAffines(List<AssetEdit> editsA, List<AssetEdit> editsB) {
  final normA = buildAffineFromEdits(editsA);
  final normB = buildAffineFromEdits(editsB);

  return (normA.a - normB.a).abs() < 0.0001 &&
      (normA.b - normB.b).abs() < 0.0001 &&
      (normA.c - normB.c).abs() < 0.0001 &&
      (normA.d - normB.d).abs() < 0.0001;
}

void main() {
  group('normalizeEdits', () {
    test('should handle no edits', () {
      final edits = <AssetEdit>[];

      final result = normalizeTransformEdits(edits);
      final normalizedEdits = normalizedToEdits(result);

      expect(compareEditAffines(normalizedEdits, edits), true);
    });

    test('should handle a single 90° rotation', () {
      final edits = <AssetEdit>[RotateEdit(RotateParameters(angle: 90))];

      final result = normalizeTransformEdits(edits);
      final normalizedEdits = normalizedToEdits(result);

      expect(compareEditAffines(normalizedEdits, edits), true);
    });

    test('should handle a single 180° rotation', () {
      final edits = <AssetEdit>[RotateEdit(RotateParameters(angle: 180))];

      final result = normalizeTransformEdits(edits);
      final normalizedEdits = normalizedToEdits(result);

      expect(compareEditAffines(normalizedEdits, edits), true);
    });

    test('should handle a single 270° rotation', () {
      final edits = <AssetEdit>[RotateEdit(RotateParameters(angle: 270))];

      final result = normalizeTransformEdits(edits);
      final normalizedEdits = normalizedToEdits(result);

      expect(compareEditAffines(normalizedEdits, edits), true);
    });

    test('should handle a single horizontal mirror', () {
      final edits = <AssetEdit>[MirrorEdit(MirrorParameters(axis: MirrorAxis.horizontal))];

      final result = normalizeTransformEdits(edits);
      final normalizedEdits = normalizedToEdits(result);

      expect(compareEditAffines(normalizedEdits, edits), true);
    });

    test('should handle a single vertical mirror', () {
      final edits = <AssetEdit>[MirrorEdit(MirrorParameters(axis: MirrorAxis.vertical))];

      final result = normalizeTransformEdits(edits);
      final normalizedEdits = normalizedToEdits(result);

      expect(compareEditAffines(normalizedEdits, edits), true);
    });

    test('should handle 90° rotation + horizontal mirror', () {
      final edits = <AssetEdit>[
        RotateEdit(RotateParameters(angle: 90)),
        MirrorEdit(MirrorParameters(axis: MirrorAxis.horizontal)),
      ];

      final result = normalizeTransformEdits(edits);
      final normalizedEdits = normalizedToEdits(result);

      expect(compareEditAffines(normalizedEdits, edits), true);
    });

    test('should handle 90° rotation + vertical mirror', () {
      final edits = <AssetEdit>[
        RotateEdit(RotateParameters(angle: 90)),
        MirrorEdit(MirrorParameters(axis: MirrorAxis.vertical)),
      ];

      final result = normalizeTransformEdits(edits);
      final normalizedEdits = normalizedToEdits(result);

      expect(compareEditAffines(normalizedEdits, edits), true);
    });

    test('should handle 90° rotation + both mirrors', () {
      final edits = <AssetEdit>[
        RotateEdit(RotateParameters(angle: 90)),
        MirrorEdit(MirrorParameters(axis: MirrorAxis.horizontal)),
        MirrorEdit(MirrorParameters(axis: MirrorAxis.vertical)),
      ];

      final result = normalizeTransformEdits(edits);
      final normalizedEdits = normalizedToEdits(result);

      expect(compareEditAffines(normalizedEdits, edits), true);
    });

    test('should handle 180° rotation + horizontal mirror', () {
      final edits = <AssetEdit>[
        RotateEdit(RotateParameters(angle: 180)),
        MirrorEdit(MirrorParameters(axis: MirrorAxis.horizontal)),
      ];

      final result = normalizeTransformEdits(edits);
      final normalizedEdits = normalizedToEdits(result);

      expect(compareEditAffines(normalizedEdits, edits), true);
    });

    test('should handle 180° rotation + vertical mirror', () {
      final edits = <AssetEdit>[
        RotateEdit(RotateParameters(angle: 180)),
        MirrorEdit(MirrorParameters(axis: MirrorAxis.vertical)),
      ];

      final result = normalizeTransformEdits(edits);
      final normalizedEdits = normalizedToEdits(result);

      expect(compareEditAffines(normalizedEdits, edits), true);
    });

    test('should handle 180° rotation + both mirrors', () {
      final edits = <AssetEdit>[
        RotateEdit(RotateParameters(angle: 180)),
        MirrorEdit(MirrorParameters(axis: MirrorAxis.horizontal)),
        MirrorEdit(MirrorParameters(axis: MirrorAxis.vertical)),
      ];

      final result = normalizeTransformEdits(edits);
      final normalizedEdits = normalizedToEdits(result);

      expect(compareEditAffines(normalizedEdits, edits), true);
    });

    test('should handle 270° rotation + horizontal mirror', () {
      final edits = <AssetEdit>[
        RotateEdit(RotateParameters(angle: 270)),
        MirrorEdit(MirrorParameters(axis: MirrorAxis.horizontal)),
      ];

      final result = normalizeTransformEdits(edits);
      final normalizedEdits = normalizedToEdits(result);

      expect(compareEditAffines(normalizedEdits, edits), true);
    });

    test('should handle 270° rotation + vertical mirror', () {
      final edits = <AssetEdit>[
        RotateEdit(RotateParameters(angle: 270)),
        MirrorEdit(MirrorParameters(axis: MirrorAxis.vertical)),
      ];

      final result = normalizeTransformEdits(edits);
      final normalizedEdits = normalizedToEdits(result);

      expect(compareEditAffines(normalizedEdits, edits), true);
    });

    test('should handle 270° rotation + both mirrors', () {
      final edits = <AssetEdit>[
        RotateEdit(RotateParameters(angle: 270)),
        MirrorEdit(MirrorParameters(axis: MirrorAxis.horizontal)),
        MirrorEdit(MirrorParameters(axis: MirrorAxis.vertical)),
      ];

      final result = normalizeTransformEdits(edits);
      final normalizedEdits = normalizedToEdits(result);

      expect(compareEditAffines(normalizedEdits, edits), true);
    });

    test('should handle horizontal mirror + 90° rotation', () {
      final edits = <AssetEdit>[
        MirrorEdit(MirrorParameters(axis: MirrorAxis.horizontal)),
        RotateEdit(RotateParameters(angle: 90)),
      ];

      final result = normalizeTransformEdits(edits);
      final normalizedEdits = normalizedToEdits(result);

      expect(compareEditAffines(normalizedEdits, edits), true);
    });

    test('should handle horizontal mirror + 180° rotation', () {
      final edits = <AssetEdit>[
        MirrorEdit(MirrorParameters(axis: MirrorAxis.horizontal)),
        RotateEdit(RotateParameters(angle: 180)),
      ];

      final result = normalizeTransformEdits(edits);
      final normalizedEdits = normalizedToEdits(result);

      expect(compareEditAffines(normalizedEdits, edits), true);
    });

    test('should handle horizontal mirror + 270° rotation', () {
      final edits = <AssetEdit>[
        MirrorEdit(MirrorParameters(axis: MirrorAxis.horizontal)),
        RotateEdit(RotateParameters(angle: 270)),
      ];

      final result = normalizeTransformEdits(edits);
      final normalizedEdits = normalizedToEdits(result);

      expect(compareEditAffines(normalizedEdits, edits), true);
    });

    test('should handle vertical mirror + 90° rotation', () {
      final edits = <AssetEdit>[
        MirrorEdit(MirrorParameters(axis: MirrorAxis.vertical)),
        RotateEdit(RotateParameters(angle: 90)),
      ];

      final result = normalizeTransformEdits(edits);
      final normalizedEdits = normalizedToEdits(result);

      expect(compareEditAffines(normalizedEdits, edits), true);
    });

    test('should handle vertical mirror + 180° rotation', () {
      final edits = <AssetEdit>[
        MirrorEdit(MirrorParameters(axis: MirrorAxis.vertical)),
        RotateEdit(RotateParameters(angle: 180)),
      ];

      final result = normalizeTransformEdits(edits);
      final normalizedEdits = normalizedToEdits(result);

      expect(compareEditAffines(normalizedEdits, edits), true);
    });

    test('should handle vertical mirror + 270° rotation', () {
      final edits = <AssetEdit>[
        MirrorEdit(MirrorParameters(axis: MirrorAxis.vertical)),
        RotateEdit(RotateParameters(angle: 270)),
      ];

      final result = normalizeTransformEdits(edits);
      final normalizedEdits = normalizedToEdits(result);

      expect(compareEditAffines(normalizedEdits, edits), true);
    });

    test('should handle both mirrors + 90° rotation', () {
      final edits = <AssetEdit>[
        MirrorEdit(MirrorParameters(axis: MirrorAxis.horizontal)),
        MirrorEdit(MirrorParameters(axis: MirrorAxis.vertical)),
        RotateEdit(RotateParameters(angle: 90)),
      ];

      final result = normalizeTransformEdits(edits);
      final normalizedEdits = normalizedToEdits(result);

      expect(compareEditAffines(normalizedEdits, edits), true);
    });

    test('should handle both mirrors + 180° rotation', () {
      final edits = <AssetEdit>[
        MirrorEdit(MirrorParameters(axis: MirrorAxis.horizontal)),
        MirrorEdit(MirrorParameters(axis: MirrorAxis.vertical)),
        RotateEdit(RotateParameters(angle: 180)),
      ];

      final result = normalizeTransformEdits(edits);
      final normalizedEdits = normalizedToEdits(result);

      expect(compareEditAffines(normalizedEdits, edits), true);
    });

    test('should handle both mirrors + 270° rotation', () {
      final edits = <AssetEdit>[
        MirrorEdit(MirrorParameters(axis: MirrorAxis.horizontal)),
        MirrorEdit(MirrorParameters(axis: MirrorAxis.vertical)),
        RotateEdit(RotateParameters(angle: 270)),
      ];

      final result = normalizeTransformEdits(edits);
      final normalizedEdits = normalizedToEdits(result);

      expect(compareEditAffines(normalizedEdits, edits), true);
    });
  });

  group('applyEditsToOcr', () {
    const box = Ocr(
      id: 'ocr',
      assetId: 'asset',
      x1: 0.0975,
      y1: 0.134167,
      x2: 0.395,
      y2: 0.134167,
      x3: 0.395,
      y3: 0.235,
      x4: 0.0975,
      y4: 0.235,
      boxScore: 0.99,
      textScore: 0.98,
      text: 'ALPHA',
      isVisible: true,
    );
    const exif = ExifInfo(width: 1600, height: 1200);
    final crop = CropEdit(CropParameters(x: 100, y: 80, width: 1000, height: 700));
    final rotate90 = RotateEdit(RotateParameters(angle: 90));
    final mirrorHorizontal = MirrorEdit(MirrorParameters(axis: MirrorAxis.horizontal));

    // corners the server's OCR endpoint returns for the same box and edits
    final cases = <(String, List<AssetEdit>, List<double>)>[
      ('rotate 90', [rotate90], [0.765, 0.0975, 0.865833, 0.0975, 0.865833, 0.395, 0.765, 0.395]),
      (
        'rotate 180',
        [RotateEdit(RotateParameters(angle: 180))],
        [0.605, 0.765, 0.9025, 0.765, 0.9025, 0.865833, 0.605, 0.865833],
      ),
      (
        'rotate 270',
        [RotateEdit(RotateParameters(angle: 270))],
        [0.134167, 0.605, 0.235, 0.605, 0.235, 0.9025, 0.134167, 0.9025],
      ),
      ('mirror horizontal', [mirrorHorizontal], [0.9025, 0.134167, 0.605, 0.134167, 0.605, 0.235, 0.9025, 0.235]),
      (
        'mirror vertical',
        [MirrorEdit(MirrorParameters(axis: MirrorAxis.vertical))],
        [0.0975, 0.865833, 0.395, 0.865833, 0.395, 0.765, 0.0975, 0.765],
      ),
      ('crop', [crop], [0.056, 0.115715, 0.532, 0.115715, 0.532, 0.288571, 0.056, 0.288571]),
      (
        'crop, rotate 90 and mirror horizontal',
        [crop, rotate90, mirrorHorizontal],
        [0.288571, 0.056, 0.115715, 0.056, 0.115715, 0.532, 0.288571, 0.532],
      ),
    ];

    for (final (name, edits, expected) in cases) {
      test(name, () {
        final [result] = applyEditsToOcr([box], edits, exif);

        expect(
          [result.x1, result.y1, result.x2, result.y2, result.x3, result.y3, result.x4, result.y4],
          [for (final value in expected) closeTo(value, 1e-6)],
        );
      });
    }
  });
}
