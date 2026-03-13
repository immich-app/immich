import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:patrol/patrol.dart';

/// Page object for the search screen.
class SearchPage {
  final PatrolIntegrationTester $;

  const SearchPage(this.$);

  /// Enter a search query.
  Future<void> search(String query) async {
    // Wait for the search field to appear (key set in drift_search.page.dart)
    final searchField = find.byKey(const Key('search_text_field'));
    // Pump frames until the search field renders
    for (var i = 0; i < 10; i++) {
      await $.pump(const Duration(milliseconds: 500));
      if ($.tester.any(searchField)) break;
    }
    await $.tester.ensureVisible(searchField);
    await $.pump();
    await $.tester.tap(searchField);
    await $.pump(const Duration(milliseconds: 500));
    await $.tester.enterText(searchField, query);
    await $.pump();
    await $.tester.testTextInput.receiveAction(TextInputAction.search);
    await $.pump(const Duration(seconds: 3));
  }

  /// Check if results contain items.
  bool get hasResults => $(Image).exists;
}
