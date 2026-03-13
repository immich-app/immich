import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/providers/user.provider.dart';
import 'package:immich_mobile/repositories/shared_space_api.repository.dart';
import 'package:openapi/api.dart';

final sharedSpacesProvider = FutureProvider<List<SharedSpaceResponseDto>>((ref) async {
  // Watch current user so the provider refreshes on login/logout
  ref.watch(currentUserProvider);
  final repository = ref.watch(sharedSpaceApiRepositoryProvider);
  return repository.getAll();
});

final sharedSpaceProvider = FutureProvider.family<SharedSpaceResponseDto, String>((ref, id) async {
  final repository = ref.watch(sharedSpaceApiRepositoryProvider);
  return repository.get(id);
});

final sharedSpaceMembersProvider = FutureProvider.family<List<SharedSpaceMemberResponseDto>, String>((
  ref,
  spaceId,
) async {
  final repository = ref.watch(sharedSpaceApiRepositoryProvider);
  return repository.getMembers(spaceId);
});

final currentSpaceMemberProvider = FutureProvider.family<SharedSpaceMemberResponseDto?, String>((ref, spaceId) async {
  final members = await ref.watch(sharedSpaceMembersProvider(spaceId).future);
  final currentUser = ref.watch(currentUserProvider);
  if (currentUser == null) return null;
  return members.where((m) => m.userId == currentUser.id).firstOrNull;
});

final spaceAssetsProvider = FutureProvider.family<List<RemoteAsset>, String>((ref, spaceId) async {
  final repository = ref.watch(sharedSpaceApiRepositoryProvider);
  return repository.getSpaceAssets(spaceId);
});
