import 'package:hooks_riverpod/hooks_riverpod.dart';

enum TabEnum {
  home,
  search,
  sharing,
  library,
}

/// Provides the currently active tab
final tabProvider = StateProvider<TabEnum>(
  (ref) => TabEnum.home,
);
