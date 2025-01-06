import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/models/upload/share_intent_attachment.model.dart';
import 'package:immich_mobile/repositories/share_handler.repository.dart';
import 'package:immich_mobile/routing/router.dart';

final shareIntentServiceProvider = Provider(
  (ref) => ShareIntentService(
    ref.watch(appRouterProvider),
    ref.watch(shareHandlerRepositoryProvider),
  ),
);

class ShareIntentService {
  final AppRouter router;
  final ShareHandlerRepository shareHandlerRepository;

  ShareIntentService(this.router, this.shareHandlerRepository);

  Future<void> init() {
    shareHandlerRepository.onSharedMedia = navigateToShareIntentRoute;
    return shareHandlerRepository.init();
  }

  void navigateToShareIntentRoute(List<ShareIntentAttachment> attachments) {
    router.push(ShareIntentRoute(attachments: attachments));
  }
}
