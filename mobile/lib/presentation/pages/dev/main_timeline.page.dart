import 'package:auto_route/auto_route.dart';
import 'package:flutter/widgets.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/presentation/widgets/timeline/timeline.widget.dart';
import 'package:immich_mobile/widgets/common/page_chrome/tab_page.dart';
import 'package:immich_mobile/widgets/common/page_chrome/types.dart';

@RoutePage()
class MainTimelinePage extends TabPage {
  const MainTimelinePage({super.key});

  @override
  Widget scopeBuilder(BuildContext context, Widget child) => timelineChromeScope(context, child);

  @override
  ProviderListenable<PageChromeContent> get content => timelineChromeProvider;
}
