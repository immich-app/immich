import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/user.model.dart';
import 'package:immich_mobile/pages/library/partner/partner.page.dart';
import 'package:immich_mobile/presentation/actions/partner.action.dart';

import '../factories/partner_user_factory.dart';
import '../factories/user_factory.dart';
import 'presentation_context.dart';

void main() {
  late PresentationContext context;

  setUp(() async => context = await PresentationContext.create());
  tearDown(() => context.dispose());

  group('PartnerSharedByList', () {
    testWidgets('shows the empty-state add button when there are no partners', (tester) async {
      final action = const PartnerAddAction();

      await tester.pumpTestWidget(context, const PartnerSharedByList(partners: []));

      expect(find.byType(ListView), findsNothing);
      expect(find.widgetWithIcon(TextButton, action.icon), findsOneWidget);
    });

    testWidgets('renders a tile per partner with name and email', (tester) async {
      final partner1 = PartnerFactory.create();
      final partner2 = PartnerFactory.create();
      await tester.pumpTestWidget(context, PartnerSharedByList(partners: [partner1, partner2]));
      expect(find.byType(ListTile), findsNWidgets(2));
      expect(find.text(partner1.name), findsOneWidget);
      expect(find.text(partner1.email), findsOneWidget);
      expect(find.text(partner2.name), findsOneWidget);
      expect(find.text(partner2.email), findsOneWidget);
    });

    testWidgets('renders a remove action for each partner', (tester) async {
      final partner1 = PartnerFactory.create(inTimeline: true);
      final partner2 = PartnerFactory.create();
      final action = const PartnerRemoveAction(sharedWithId: '', partnerName: '');
      await tester.pumpTestWidget(context, PartnerSharedByList(partners: [partner1, partner2]));
      expect(find.byIcon(action.icon), findsNWidgets(2));
    });
  });

  group('PartnerSelectionDialog', () {
    final dialogButtonKey = UniqueKey();

    Widget dialogWidget({void Function(User?)? onClosed}) {
      return Builder(
        builder: (context) => ElevatedButton(
          onPressed: () async {
            final selected = await showDialog<User>(context: context, builder: (_) => const PartnerSelectionDialog());
            onClosed?.call(selected);
          },
          child: Text(key: dialogButtonKey, 'open'),
        ),
      );
    }

    List<Override> withCandidates(List<User> candidates) => [
      candidatesStateProvider.overrideWith((ref) => Stream<Iterable<User>>.value(candidates)),
    ];

    testWidgets('renders an option per candidate fetched from the provider', (tester) async {
      final user = UserFactory.create();
      await tester.pumpTestWidget(context, dialogWidget(), overrides: withCandidates([user]));

      await tester.tap(find.byKey(dialogButtonKey));
      await tester.pumpAndSettle();

      expect(find.byType(SimpleDialogOption), findsOneWidget);
      expect(find.text(user.name), findsOneWidget);
    });

    testWidgets('shows no options when the provider returns no candidates', (tester) async {
      await tester.pumpTestWidget(context, dialogWidget(), overrides: withCandidates(const []));

      await tester.tap(find.byKey(dialogButtonKey));
      await tester.pumpAndSettle();

      expect(find.byType(SimpleDialogOption), findsNothing);
    });

    testWidgets('pops the selected candidate when an option is tapped', (tester) async {
      final user = UserFactory.create();
      User? selected;
      await tester.pumpTestWidget(
        context,
        dialogWidget(onClosed: (user) => selected = user),
        overrides: withCandidates([user]),
      );

      await tester.tap(find.byKey(dialogButtonKey));
      await tester.pumpAndSettle();

      await tester.tap(find.text(user.name));
      await tester.pumpAndSettle();

      expect(selected, user);
    });
  });
}
