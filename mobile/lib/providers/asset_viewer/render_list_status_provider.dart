import 'package:hooks_riverpod/hooks_riverpod.dart';

enum RenderListStatusEnum { complete, empty, error, loading }

final renderListStatusProvider =
    StateNotifierProvider<RenderListStatus, RenderListStatusEnum>((ref) {
  return RenderListStatus(ref);
});

class RenderListStatus extends StateNotifier<RenderListStatusEnum> {
  RenderListStatus(this.ref) : super(RenderListStatusEnum.complete);

  final Ref ref;

  RenderListStatusEnum get status => state;

  set status(RenderListStatusEnum value) {
    state = value;
  }
}
