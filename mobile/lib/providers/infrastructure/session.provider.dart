import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/session.model.dart';
import 'package:immich_mobile/infrastructure/repositories/session.repository.dart';

final sessionRepository = Provider.autoDispose<SessionRepository>((_) => SessionRepository.instance);

final sessionProvider = Provider.autoDispose<Session>((ref) {
  final repo = ref.watch(sessionRepository);
  final subscription = repo.watch().listen((event) => ref.state = event);
  ref.onDispose(subscription.cancel);
  return repo.session;
});
