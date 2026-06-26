import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/user.model.dart';
import 'package:immich_mobile/presentation/actions/partner.action.dart';
import 'package:immich_mobile/providers/infrastructure/user.provider.dart';
import 'package:mocktail/mocktail.dart';

import '../../factories/user_factory.dart';
import '../../presentation_context.dart';

void main() {
  late PresentationContext context;

  setUp(() async {
    context = await PresentationContext.create();
  });

  tearDown(() {
    context.dispose();
  });

  List<Override> overrides({List<User> candidates = const []}) => [
    ...context.overrides,
    partnerServiceProvider.overrideWithValue(context.mocks.partner.service),
    candidatesStateProvider.overrideWith((ref) => Stream<Iterable<User>>.value(candidates)),
  ];

  group('PartnerAddAction', () {
    testWidgets('creates a partner for the selected candidate', (tester) async {
      final candidate = UserFactory.create();

      await tester.pumpTestAction(const PartnerAddAction(), overrides: overrides(candidates: [candidate]));
      await tester.pumpUntilFound(find.text(candidate.name));
      await tester.tap(find.text(candidate.name));
      await tester.pumpAndSettle();

      verify(
        () => context.mocks.partner.service.create(sharedById: context.currentUser.id, sharedWithId: candidate.id),
      ).called(1);
    });

    testWidgets('creates nothing when the selection dialog is dismissed', (tester) async {
      await tester.pumpTestAction(const PartnerAddAction(), overrides: overrides(candidates: [UserFactory.create()]));
      await tester.sendKeyEvent(LogicalKeyboardKey.escape); // dismiss without selecting
      await tester.pumpAndSettle();

      verifyNever(context.mocks.partner.create);
    });
  });

  group('PartnerRemoveAction', () {
    testWidgets('deletes the partner after confirmation', (tester) async {
      final partner = UserFactory.create();
      await tester.pumpTestAction(
        PartnerRemoveAction(sharedWithId: partner.id, partnerName: partner.name),
        overrides: overrides(),
      );
      await tester.tap(find.byType(TextButton).last); // confirm
      await tester.pumpAndSettle();

      verify(
        () => context.mocks.partner.service.delete(sharedById: context.currentUser.id, sharedWithId: partner.id),
      ).called(1);
    });

    testWidgets('deletes nothing when the confirmation is cancelled', (tester) async {
      final partner = UserFactory.create();
      await tester.pumpTestAction(
        PartnerRemoveAction(sharedWithId: partner.id, partnerName: partner.name),
        overrides: overrides(),
      );
      await tester.tap(find.byType(TextButton).first); // cancel
      await tester.pumpAndSettle();

      verifyNever(context.mocks.partner.delete);
    });
  });
}
