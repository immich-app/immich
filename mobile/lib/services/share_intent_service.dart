import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/routing/router.dart';
import 'package:share_handler/share_handler.dart';

final shareIntentServiceProvider = Provider(
  (ref) => ShareIntentService(
    ref.watch(appRouterProvider),
  ),
);

class ShareIntentService {
  final AppRouter router;

  ShareIntentService(this.router);

  void setup() async {
    final handler = ShareHandlerPlatform.instance;
    final media = await handler.getInitialSharedMedia();

    if (media?.attachments != null) {
      navigateToShareIntentRoute(media!.attachments!);
    }

    handler.sharedMediaStream.listen((SharedMedia media) {
      if (media.attachments != null) {
        navigateToShareIntentRoute(media.attachments!);
      }
    });
  }

  void navigateToShareIntentRoute(List<SharedAttachment?> attachments) {
    router.push(ShareIntentRoute(attachments: attachments));
  }
}
