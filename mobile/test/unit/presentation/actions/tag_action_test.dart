import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/generated/translations.g.dart';
import 'package:immich_mobile/presentation/actions/tag.action.dart';

import '../../factories/remote_asset_factory.dart';
import '../presentation_context.dart';

void main() {
  late PresentationContext context;

  setUp(() async {
    context = await PresentationContext.create();
  });

  tearDown(() {
    context.dispose();
  });

  RemoteAsset owned() => RemoteAssetFactory.create(ownerId: context.currentUser.id);

  const action = TagAction();

  group('TagAction', () {
    testWidgets('visible with an owned remote asset', (tester) async {
      final resolved = await tester.resolveAction(context, action, assets: [owned()]);

      expect(resolved, isNotNull);
      expect(resolved!.icon, Icons.sell_outlined);
      expect(resolved.label, StaticTranslations.instance.control_bottom_app_bar_add_tags);
    });

    testWidgets('hidden for an asset owned by someone else', (tester) async {
      final resolved = await tester.resolveAction(context, action, assets: [RemoteAssetFactory.create()]);

      expect(resolved, isNull);
    });
  });
}
