import 'package:immich_mobile/models/upload/share_intent_attachment.model.dart';

abstract interface class IShareHandlerRepository {
  void Function(List<ShareIntentAttachment>)? onSharedMedia;

  Future<void> init();
}
