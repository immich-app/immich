import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/generated/translations.g.dart';
import 'package:immich_mobile/presentation/actions/upload.action.dart';
import 'package:immich_mobile/services/foreground_upload.service.dart';
import 'package:immich_ui/immich_ui.dart';
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

  void whenUpload(void Function(UploadCallbacks callbacks) simulate) {
    when(
      () => uploadService.uploadManual(
        any(),
        cancelToken: any(named: 'cancelToken'),
        callbacks: any(named: 'callbacks'),
      ),
    ).thenAnswer((inv) async => simulate(inv.namedArguments[#callbacks] as UploadCallbacks));
  }

  group('UploadAction', () {
    testWidgets('visible with a local asset', (tester) async {
      final action = await tester.pumpActionButton(
        context,
        (scope) => UploadAction(assets: [LocalAssetFactory.create()], scope: scope),
      );

      expect(action.isVisible, isTrue);
      expect(action.icon, Icons.backup_outlined);
      expect(action.label, StaticTranslations.instance.upload);
      expect(find.byType(ImmichIconButton), findsOneWidget);
    });

    testWidgets('hidden without any local asset', (tester) async {
      final action = await tester.pumpActionButton(context, (scope) => UploadAction(assets: const [], scope: scope));

      expect(action.isVisible, isFalse);
      expect(find.byType(ImmichIconButton), findsNothing);
    });

    testWidgets('uploads the assets with no error toast on success', (tester) async {
      final asset = LocalAssetFactory.create();
      final toast = context.repository.toast;
      whenUpload((cb) => cb.onSuccess?.call(asset.id, 'remote-1'));

      final action =
          await tester.pumpActionButton(context, (scope) => UploadAction(assets: [asset], scope: scope))
              as UploadAction;

      await action.upload();
      await tester.pump(const Duration(seconds: 2)); // flush the delayed progress clear

      verify(
        () => uploadService.uploadManual(
          any(that: contains(asset)),
          cancelToken: any(named: 'cancelToken'),
          callbacks: any(named: 'callbacks'),
        ),
      ).called(1);
      verifyNever(() => toast.error(any()));
    });

    testWidgets('shows an error toast when an asset fails', (tester) async {
      final asset = LocalAssetFactory.create();
      final toast = context.repository.toast;
      whenUpload((cb) => cb.onError?.call(asset.id, 'boom'));

      final action =
          await tester.pumpActionButton(context, (scope) => UploadAction(assets: [asset], scope: scope))
              as UploadAction;

      await action.upload();
      await tester.pump(const Duration(seconds: 2));

      verify(() => toast.error(StaticTranslations.instance.scaffold_body_error_occurred)).called(1);
    });

    testWidgets('shows the progress dialog when showProgress is true', (tester) async {
      final asset = LocalAssetFactory.create();
      final gate = Completer<void>();
      when(
        () => uploadService.uploadManual(
          any(),
          cancelToken: any(named: 'cancelToken'),
          callbacks: any(named: 'callbacks'),
        ),
      ).thenAnswer((_) => gate.future);

      await tester.pumpTestAction(context, (scope) => UploadAction(assets: [asset], scope: scope, showProgress: true));
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
