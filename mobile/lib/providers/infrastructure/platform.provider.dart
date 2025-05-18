import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/platform/messages.g.dart';

final hostApiProvider = Provider<ImHostApi>((_) => ImHostApi());
