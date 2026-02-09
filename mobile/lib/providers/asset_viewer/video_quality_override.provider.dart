import 'package:hooks_riverpod/hooks_riverpod.dart';

// null = use global setting
// true = force original
// false = force transcoded
final videoQualityOverrideProvider = StateProvider.autoDispose<bool?>((ref) => null);
