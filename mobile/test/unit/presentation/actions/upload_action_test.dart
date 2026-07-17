import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/generated/translations.g.dart';
import 'package:immich_mobile/presentation/actions/upload.action.dart';
import 'package:mocktail/mocktail.dart';

import '../../../domain/service.mock.dart';
import '../../factories/local_asset_factory.dart';
import '../presentation_context.dart';

void main() {
  late PresentationContext context;
  late MockForegroundUploadService uploadService;

  setUp(() async {
    context = await PresentationContext.create();
    uploadService = context.service.upload;
  });

  tearDown(() {
    context.dispose();
  });

  const action = UploadAction(source: .timeline);

  group('UploadAction', () {
    testWidgets('visible with a local asset', (tester) async {
      final resolved = await tester.resolveAction(context, action, assets: [LocalAssetFactory.create()]);

      expect(resolved, isNotNull);
      expect(resolved!.icon, Icons.backup_outlined);
      expect(resolved.label, StaticTranslations.instance.upload);
    });

    testWidgets('hidden without any local asset', (tester) async {
      final resolved = await tester.resolveAction(context, action, assets: const []);

      expect(resolved, isNull);
    });

    testWidgets('shows the progress dialog when launched from the viewer', (tester) async {
      final asset = LocalAssetFactory.create();
      final gate = Completer<void>();
      when(
        () => uploadService.uploadManual(
          any(),
          cancelToken: any(named: 'cancelToken'),
          callbacks: any(named: 'callbacks'),
        ),
      ).thenAnswer((_) => gate.future);

      final resolved = await tester.resolveAction(context, const UploadAction(source: .viewer), assets: [asset]);
      unawaited(resolved!.onAction());
      await tester.pump();

      expect(find.text(StaticTranslations.instance.uploading), findsOneWidget);

      gate.complete();
      await tester.pump();
      await tester.pump(const Duration(seconds: 2));
      await tester.pumpAndSettle();

      expect(find.text(StaticTranslations.instance.uploading), findsNothing);
    });
  });
}
