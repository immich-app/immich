import 'dart:async';

import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/domain/services/timeline.service.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/presentation/widgets/bottom_sheet/space_bottom_sheet.widget.dart';
import 'package:immich_mobile/presentation/widgets/timeline/timeline.widget.dart';
import 'package:immich_mobile/providers/infrastructure/timeline.provider.dart';
import 'package:immich_mobile/providers/shared_space.provider.dart';
import 'package:immich_mobile/providers/user.provider.dart';
import 'package:immich_mobile/repositories/shared_space_api.repository.dart';
import 'package:immich_mobile/routing/router.dart';
import 'package:immich_mobile/widgets/common/immich_toast.dart';
import 'package:openapi/api.dart';

@RoutePage()
class SpaceDetailPage extends ConsumerStatefulWidget {
  final String spaceId;

  const SpaceDetailPage({super.key, required this.spaceId});

  @override
  ConsumerState<SpaceDetailPage> createState() => _SpaceDetailPageState();
}

class _SpaceDetailPageState extends ConsumerState<SpaceDetailPage> {
  SharedSpaceResponseDto? _space;
  List<SharedSpaceMemberResponseDto>? _members;
  List<RemoteAsset>? _assets;
  String? _error;
  bool _loading = true;
  bool _togglingTimeline = false;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    try {
      final repo = ref.read(sharedSpaceApiRepositoryProvider);
      final results = await Future.wait([
        repo.get(widget.spaceId),
        repo.getMembers(widget.spaceId),
        repo.getSpaceAssets(widget.spaceId),
      ]);

      if (mounted) {
        setState(() {
          _space = results[0] as SharedSpaceResponseDto;
          _members = results[1] as List<SharedSpaceMemberResponseDto>;
          _assets = results[2] as List<RemoteAsset>;
          _loading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _error = e.toString();
          _loading = false;
        });
      }
    }
  }

  Future<void> _refreshAssets() async {
    try {
      final repo = ref.read(sharedSpaceApiRepositoryProvider);
      final assets = await repo.getSpaceAssets(widget.spaceId);
      final space = await repo.get(widget.spaceId);
      if (mounted) {
        setState(() {
          _assets = assets;
          _space = space;
        });
      }
    } catch (_) {}
  }

  SharedSpaceMemberResponseDto? get _currentMember {
    final currentUser = ref.read(currentUserProvider);
    if (currentUser == null || _members == null) return null;
    return _members!.where((m) => m.userId == currentUser.id).firstOrNull;
  }

  bool get _isOwner {
    final member = _currentMember;
    if (member == null) return false;
    return member.role == SharedSpaceMemberResponseDtoRoleEnum.owner;
  }

  bool get _canEdit {
    final member = _currentMember;
    if (member == null) return false;
    return member.role == SharedSpaceMemberResponseDtoRoleEnum.owner ||
        member.role == SharedSpaceMemberResponseDtoRoleEnum.editor;
  }

  SharedSpaceRole get _currentRole {
    final member = _currentMember;
    if (member == null) return SharedSpaceRole.viewer;
    return SharedSpaceRole.fromJson(member.role.value) ?? SharedSpaceRole.viewer;
  }

  Future<void> _addPhotos() async {
    final newAssets = await context.pushRoute<Set<BaseAsset>>(DriftAssetSelectionTimelineRoute());

    if (newAssets == null || newAssets.isEmpty) return;

    try {
      final assetIds = newAssets.map((a) => (a as RemoteAsset).id).toList();
      await ref.read(sharedSpaceApiRepositoryProvider).addAssets(widget.spaceId, assetIds);
      ref.invalidate(sharedSpacesProvider);
      if (context.mounted) {
        ImmichToast.show(
          context: context,
          msg: 'Added ${assetIds.length} photos to space',
          toastType: ToastType.success,
        );
      }
      await _refreshAssets();
    } catch (e) {
      if (context.mounted) {
        ImmichToast.show(context: context, msg: 'Failed to add photos', toastType: ToastType.error);
      }
    }
  }

  Future<void> _deleteSpace() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Delete Space'),
        content: Text('Are you sure you want to delete "${_space?.name}"? This cannot be undone.'),
        actions: [
          TextButton(onPressed: () => Navigator.of(ctx).pop(false), child: const Text('Cancel')),
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(true),
            style: TextButton.styleFrom(foregroundColor: Theme.of(ctx).colorScheme.error),
            child: const Text('Delete'),
          ),
        ],
      ),
    );

    if (confirmed == true) {
      try {
        await ref.read(sharedSpaceApiRepositoryProvider).delete(widget.spaceId);
        ref.invalidate(sharedSpacesProvider);
        if (context.mounted) {
          ImmichToast.show(context: context, msg: 'Space deleted', toastType: ToastType.success);
          await context.maybePop();
        }
      } catch (e) {
        if (context.mounted) {
          ImmichToast.show(context: context, msg: 'Failed to delete space', toastType: ToastType.error);
        }
      }
    }
  }

  bool get _showInTimeline {
    final member = _currentMember;
    return member?.showInTimeline ?? true;
  }

  Future<void> _toggleTimeline() async {
    if (_togglingTimeline) return;
    setState(() => _togglingTimeline = true);
    try {
      final newValue = !_showInTimeline;
      final repo = ref.read(sharedSpaceApiRepositoryProvider);
      await repo.updateMemberTimeline(widget.spaceId, showInTimeline: newValue);
      final members = await repo.getMembers(widget.spaceId);
      if (mounted) {
        setState(() {
          _members = members;
          _togglingTimeline = false;
        });
        ImmichToast.show(
          context: context,
          msg: newValue ? 'Space added to timeline' : 'Space removed from timeline',
          toastType: ToastType.success,
        );
      }
    } catch (e) {
      if (mounted) {
        setState(() => _togglingTimeline = false);
        ImmichToast.show(context: context, msg: 'Failed to update timeline setting', toastType: ToastType.error);
      }
    }
  }

  void _navigateToMembers() {
    context.pushRoute(SpaceMembersRoute(spaceId: widget.spaceId)).then((_) => _loadData());
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return Scaffold(
        appBar: AppBar(title: const Text('Space')),
        body: const Center(child: CircularProgressIndicator()),
      );
    }

    if (_error != null || _space == null) {
      return Scaffold(
        appBar: AppBar(title: const Text('Space')),
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.error_outline, size: 48),
              const SizedBox(height: 16),
              Text('Failed to load space: ${_error ?? "Unknown error"}'),
              const SizedBox(height: 16),
              ElevatedButton(
                onPressed: () {
                  setState(() {
                    _loading = true;
                    _error = null;
                  });
                  _loadData();
                },
                child: const Text('Retry'),
              ),
            ],
          ),
        ),
      );
    }

    final assets = _assets ?? [];

    if (assets.isEmpty) {
      return _buildEmptyState();
    }

    return ProviderScope(
      overrides: [
        timelineServiceProvider.overrideWith((ref) {
          final timelineService = ref
              .watch(timelineFactoryProvider)
              .fromAssetsWithBuckets(assets, TimelineOrigin.remoteSpace);
          ref.onDispose(timelineService.dispose);
          return timelineService;
        }),
      ],
      child: Timeline(
        appBar: SliverAppBar(
          title: Text(_space!.name),
          centerTitle: false,
          floating: true,
          pinned: false,
          snap: false,
          actions: [
            IconButton(
              icon: Icon(_showInTimeline ? Icons.visibility : Icons.visibility_off),
              onPressed: _togglingTimeline ? null : _toggleTimeline,
              tooltip: _showInTimeline ? 'Hide from timeline' : 'Show in timeline',
            ),
            if (_canEdit)
              IconButton(
                icon: const Icon(Icons.add_photo_alternate_outlined),
                onPressed: _addPhotos,
                tooltip: 'Add Photos',
              ),
            IconButton(icon: const Icon(Icons.people_outline), onPressed: _navigateToMembers, tooltip: 'Members'),
            if (_isOwner)
              PopupMenuButton<String>(
                onSelected: (value) {
                  if (value == 'delete') _deleteSpace();
                },
                itemBuilder: (context) => [const PopupMenuItem(value: 'delete', child: Text('Delete Space'))],
              ),
          ],
        ),
        bottomSheet: SpaceBottomSheet(
          spaceId: widget.spaceId,
          currentUserRole: _currentRole,
          onAssetsRemoved: _refreshAssets,
        ),
      ),
    );
  }

  Widget _buildEmptyState() {
    return Scaffold(
      appBar: AppBar(
        title: Text(_space!.name),
        centerTitle: false,
        actions: [
          IconButton(
            icon: Icon(_showInTimeline ? Icons.visibility : Icons.visibility_off),
            onPressed: _togglingTimeline ? null : _toggleTimeline,
            tooltip: _showInTimeline ? 'Hide from timeline' : 'Show in timeline',
          ),
          IconButton(icon: const Icon(Icons.people_outline), onPressed: _navigateToMembers),
          if (_isOwner)
            PopupMenuButton<String>(
              onSelected: (value) {
                if (value == 'delete') _deleteSpace();
              },
              itemBuilder: (context) => [const PopupMenuItem(value: 'delete', child: Text('Delete Space'))],
            ),
        ],
      ),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.photo_library_outlined, size: 64, color: context.colorScheme.onSurface.withAlpha(100)),
            const SizedBox(height: 16),
            Text(
              'No photos yet',
              style: context.textTheme.titleMedium?.copyWith(color: context.colorScheme.onSurface.withAlpha(150)),
            ),
            if (_canEdit) ...[
              const SizedBox(height: 24),
              ElevatedButton.icon(
                onPressed: _addPhotos,
                icon: const Icon(Icons.add_photo_alternate_outlined),
                label: const Text('Add Photos'),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
