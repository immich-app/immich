import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/domain/models/tag.model.dart';
import 'package:immich_mobile/generated/translations.g.dart';
import 'package:immich_mobile/presentation/actions/tag.action.dart';
import 'package:mocktail/mocktail.dart';

import '../../../repository.mocks.dart';
import '../../factories/remote_asset_factory.dart';
import '../presentation_context.dart';

void main() {
  late PresentationContext context;
  late MockTagService tagService;

  setUp(() async {
    context = await PresentationContext.create();
    tagService = context.service.tag.service;
  });

  tearDown(() {
    context.dispose();
  });

  RemoteAsset owned() => RemoteAssetFactory.create(ownerId: context.currentUser.id);

  group('TagAssetsAction', () {
    testWidgets('visible with an owned remote asset', (tester) async {
      final action = await tester.pumpActionButton(context, (scope) => TagAction(assets: [owned()], scope: scope));

      expect(action.isVisible, isTrue);
      expect(action.icon, Icons.sell_outlined);
      expect(action.label, StaticTranslations.instance.control_bottom_app_bar_add_tags);
    });

    testWidgets('hidden for an asset owned by someone else', (tester) async {
      final action = await tester.pumpActionButton(
        context,
        (scope) => TagAction(assets: [RemoteAssetFactory.create()], scope: scope),
      );

      expect(action.isVisible, isFalse);
    });

    testWidgets('collects only the owned remote asset ids', (tester) async {
      final mine = owned();
      final theirs = RemoteAssetFactory.create();

      final action = await tester.pumpActionButton(context, (scope) => TagAction(assets: [mine, theirs], scope: scope));

      expect((action as TagAction).assetIds, [mine.id]);
    });

    testWidgets('applies the selected tags and toasts the count', (tester) async {
      final asset = owned();
      final toast = context.repository.toast;
      when(context.service.tag.bulkTagAssets).thenAnswer((_) async => 2);

      final action = await tester.pumpActionButton(context, (scope) => TagAction(assets: [asset], scope: scope));

      await (action as TagAction).tagAssets(selected: {'tag'}, created: const {});

      verify(() => tagService.bulkTagAssets([asset.id], ['tag'])).called(1);
      final message = verify(() => toast.success(captureAny())).captured.single as String;
      expect(message, StaticTranslations.instance.tagged_assets(count: 2));
    });

    testWidgets('creates new tags before applying them', (tester) async {
      final asset = owned();
      when(() => tagService.upsertTags(['new'])).thenAnswer((_) async => const [Tag(id: 'tag', value: 'new')]);
      when(context.service.tag.bulkTagAssets).thenAnswer((_) async => 1);

      final action = await tester.pumpActionButton(context, (scope) => TagAction(assets: [asset], scope: scope));

      await (action as TagAction).tagAssets(selected: const {}, created: {'new'});

      verify(() => tagService.upsertTags(['new'])).called(1);
      verify(() => tagService.bulkTagAssets([asset.id], ['tag'])).called(1);
    });

    testWidgets('does nothing when no tags are chosen', (tester) async {
      final asset = owned();

      final action = await tester.pumpActionButton(context, (scope) => TagAction(assets: [asset], scope: scope));

      await (action as TagAction).tagAssets(selected: const {}, created: const {});

      verifyNever(context.service.tag.bulkTagAssets);
    });
  });
}
