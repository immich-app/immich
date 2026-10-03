import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/presentation/widgets/asset_viewer/asset_details/asset_owner_details.widget.dart';
import 'package:mocktail/mocktail.dart';

import '../factories/local_asset_factory.dart';
import '../factories/remote_asset_factory.dart';
import '../factories/user_factory.dart';
import 'presentation_context.dart';

void main() {
  late PresentationContext context;

  setUp(() async => context = await PresentationContext.create());
  tearDown(() => context.dispose());

  group('AssetOwnerDetails', () {
    testWidgets('renders nothing for a local asset', (tester) async {
      await tester.pumpTestWidget(context, AssetOwnerDetails(asset: LocalAssetFactory.create()));

      expect(find.byType(Text), findsNothing);
      verifyNever(context.service.user.watch);
    });

    testWidgets('renders nothing when the asset is owned by the current user', (tester) async {
      final asset = RemoteAssetFactory.create(ownerId: context.currentUser.id);

      await tester.pumpTestWidget(context, AssetOwnerDetails(asset: asset));

      expect(find.byType(Text), findsNothing);
      verifyNever(context.service.user.watch);
    });

    testWidgets('renders shared by for an asset owned by someone else', (tester) async {
      final owner = UserFactory.create();
      when(context.service.user.watch).thenAnswer((_) => Stream.value(owner));

      await tester.pumpTestWidget(context, AssetOwnerDetails(asset: RemoteAssetFactory.create(ownerId: owner.id)));

      expect(find.text('Shared by ${owner.name}'), findsOneWidget);
      verify(() => context.service.user.service.watch(owner.id)).called(1);
    });

    testWidgets('renders nothing while the owner is unknown', (tester) async {
      when(context.service.user.watch).thenAnswer((_) => Stream.value(null));

      await tester.pumpTestWidget(context, AssetOwnerDetails(asset: RemoteAssetFactory.create()));

      expect(find.byType(Text), findsNothing);
    });
  });
}
