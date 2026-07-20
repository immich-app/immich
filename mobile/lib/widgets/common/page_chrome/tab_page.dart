import 'package:flutter/widgets.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/widgets/common/page_chrome/page_chrome.dart';
import 'package:immich_mobile/widgets/common/page_chrome/types.dart';

/// The base type for a page rendered as a primary tab.
///
/// Extending [TabPage] is the *only* place that knows the page is a tab: a
/// subclass declares its chrome [content] provider and, if needed, the
/// [scopeBuilder] the provider must be read within. The [PageChrome] is
/// rendered automatically beneath that scope, so it reads the tab's content
/// provider as a descendant (same frame). Nothing beneath the chrome has any
/// knowledge of tabs.
abstract class TabPage extends ConsumerWidget {
  const TabPage({super.key});

  /// The provider that yields this tab's chrome content (app bar + slivers +
  /// controller + decorators). Read beneath [scopeBuilder].
  ProviderListenable<PageChromeContent> get content;

  /// Produces the scope the [content] provider must be read within (e.g. the
  /// timeline's `LayoutBuilder` + `timelineArgsProvider` override). Defaults to
  /// the identity scope.
  Widget scopeBuilder(BuildContext context, Widget child) => child;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return scopeBuilder(context, PageChrome(content: content));
  }
}
