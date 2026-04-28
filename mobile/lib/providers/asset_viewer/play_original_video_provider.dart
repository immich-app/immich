import 'package:hooks_riverpod/hooks_riverpod.dart';

final playOriginalVideoProvider = StateProvider.autoDispose.family<bool, String>((ref, assetId) => false);
