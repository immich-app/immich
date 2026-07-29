import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/repositories/toast.repository.dart';

final toastRepositoryProvider = Provider<ToastRepository>((ref) => const .new());
