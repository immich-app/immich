import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/domain/models/asset_edit.model.dart';
import 'package:immich_mobile/utils/editor.utils.dart';
import 'package:openapi/api.dart' show MirrorAxis, MirrorParameters, RotateParameters;

List<AssetEdit> normalizedToEdits(NormalizedTransform transform) {
  List<AssetEdit> edits = [];

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

  return ((normA.a - normB.a).abs() < 0.0001 &&
      (normA.b - normB.b).abs() < 0.0001 &&
      (normA.c - normB.c).abs() < 0.0001 &&
      (normA.d - normB.d).abs() < 0.0001);
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
      final edits = <AssetEdit>[
        RotateEdit(RotateParameters(angle: 90)),
      ];

      final result = normalizeTransformEdits(edits);
      final normalizedEdits = normalizedToEdits(result);

      expect(compareEditAffines(normalizedEdits, edits), true);
    });

    test('should handle a single 180° rotation', () {
      final edits = <AssetEdit>[
        RotateEdit(RotateParameters(angle: 180)),
      ];

      final result = normalizeTransformEdits(edits);
      final normalizedEdits = normalizedToEdits(result);

      expect(compareEditAffines(normalizedEdits, edits), true);
    });

    test('should handle a single 270° rotation', () {
      final edits = <AssetEdit>[
        RotateEdit(RotateParameters(angle: 270)),
      ];

      final result = normalizeTransformEdits(edits);
      final normalizedEdits = normalizedToEdits(result);

      expect(compareEditAffines(normalizedEdits, edits), true);
    });

    test('should handle a single horizontal mirror', () {
      final edits = <AssetEdit>[
        MirrorEdit(MirrorParameters(axis: MirrorAxis.horizontal)),
      ];

      final result = normalizeTransformEdits(edits);
      final normalizedEdits = normalizedToEdits(result);

      expect(compareEditAffines(normalizedEdits, edits), true);
    });

    test('should handle a single vertical mirror', () {
      final edits = <AssetEdit>[
        MirrorEdit(MirrorParameters(axis: MirrorAxis.vertical)),
      ];

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
}
