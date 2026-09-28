import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/services/toast.service.dart';

final toastServiceProvider = Provider<ToastService>((ref) => const .new());
