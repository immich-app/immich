import 'package:flutter/material.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/widgets/spaces/space_collage.dart';
import 'package:openapi/api.dart';

class SpaceCard extends StatelessWidget {
  final SharedSpaceResponseDto space;
  final VoidCallback onTap;

  const SpaceCard({super.key, required this.space, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final hasNewAssets = space.newAssetCount != null && space.newAssetCount! > 0;

    return GestureDetector(
      onTap: onTap,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min,
        children: [
          LayoutBuilder(
            builder: (context, constraints) {
              final width = constraints.maxWidth;
              return Stack(
                children: [
                  SpaceCollage(
                    recentAssetIds: space.recentAssetIds,
                    recentAssetThumbhashes: space.recentAssetThumbhashes,
                    color: space.color,
                    size: width,
                  ),
                  // Activity dot
                  if (hasNewAssets)
                    Positioned(
                      top: 8,
                      right: 8,
                      child: Container(
                        width: 10,
                        height: 10,
                        decoration: BoxDecoration(
                          color: context.primaryColor,
                          shape: BoxShape.circle,
                          boxShadow: [
                            BoxShadow(
                              color: context.primaryColor.withValues(alpha: 0.4),
                              blurRadius: 6,
                              spreadRadius: 1,
                            ),
                          ],
                        ),
                      ),
                    ),
                  // Member avatar stack
                  if (space.members.isNotEmpty)
                    Positioned(bottom: 8, right: 8, child: _MemberAvatarStack(members: space.members)),
                ],
              );
            },
          ),
          // Space name
          Padding(
            padding: const EdgeInsets.only(top: 8),
            child: Text(
              space.name,
              style: context.textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w600),
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),
          ),
          // Activity text
          if (hasNewAssets)
            Padding(
              padding: const EdgeInsets.only(top: 2),
              child: Text(
                _activityText(),
                style: context.textTheme.bodySmall?.copyWith(color: context.primaryColor, fontWeight: FontWeight.w500),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
            ),
          // Details row
          Padding(
            padding: const EdgeInsets.only(top: 2),
            child: Text(
              _detailsText(),
              style: context.textTheme.bodySmall?.copyWith(color: context.colorScheme.onSurface.withAlpha(150)),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ),
        ],
      ),
    );
  }

  String _activityText() {
    final count = space.newAssetCount?.toInt() ?? 0;
    final countStr = count > 99 ? '99+' : '$count';
    final contributorName = space.lastContributor?.name;

    if (contributorName != null && contributorName.isNotEmpty) {
      return '$contributorName added $countStr new';
    }
    return '$countStr new photos';
  }

  String _detailsText() {
    final assetCount = space.assetCount?.toInt() ?? 0;
    final memberCount = space.memberCount?.toInt() ?? 0;
    final photos = '$assetCount photo${assetCount == 1 ? '' : 's'}';
    final members = '$memberCount member${memberCount == 1 ? '' : 's'}';
    return '$photos \u00B7 $members';
  }
}

class _MemberAvatarStack extends StatelessWidget {
  final List<SharedSpaceMemberResponseDto> members;

  static const double _avatarSize = 28;
  static const double _overlap = 8;
  static const int _maxVisible = 4;

  static const List<Color> _palette = [
    Color(0xFF6366F1), // indigo
    Color(0xFFEC4899), // pink
    Color(0xFFEF4444), // red
    Color(0xFFF59E0B), // amber
    Color(0xFF3B82F6), // blue
    Color(0xFF22C55E), // green
    Color(0xFF8B5CF6), // purple
    Color(0xFFF97316), // orange
    Color(0xFF6B7280), // grey
    Color(0xFF14B8A6), // teal
  ];

  const _MemberAvatarStack({required this.members});

  static Color _colorForMember(SharedSpaceMemberResponseDto member) {
    final hash = member.userId.hashCode.abs();
    return _palette[hash % _palette.length];
  }

  @override
  Widget build(BuildContext context) {
    final visibleCount = members.length > _maxVisible ? _maxVisible : members.length;
    final overflow = members.length - _maxVisible;
    final totalItems = visibleCount + (overflow > 0 ? 1 : 0);
    final totalWidth = _avatarSize + (_avatarSize - _overlap) * (totalItems - 1);

    return SizedBox(
      width: totalWidth,
      height: _avatarSize,
      child: Stack(
        children: [
          for (int i = 0; i < visibleCount; i++)
            Positioned(left: i * (_avatarSize - _overlap), child: _buildAvatar(members[i])),
          if (overflow > 0)
            Positioned(left: visibleCount * (_avatarSize - _overlap), child: _buildOverflowBadge(overflow)),
        ],
      ),
    );
  }

  Widget _buildAvatar(SharedSpaceMemberResponseDto member) {
    final initial = member.name.isNotEmpty ? member.name[0].toUpperCase() : '?';
    final bgColor = _colorForMember(member);

    return Container(
      width: _avatarSize,
      height: _avatarSize,
      decoration: BoxDecoration(
        color: bgColor,
        shape: BoxShape.circle,
        border: Border.all(color: Colors.white, width: 1.5),
        boxShadow: const [BoxShadow(color: Color(0x33000000), blurRadius: 2, offset: Offset(0, 1))],
      ),
      child: Center(
        child: Text(
          initial,
          style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold, height: 1),
        ),
      ),
    );
  }

  Widget _buildOverflowBadge(int overflow) {
    return Container(
      width: _avatarSize,
      height: _avatarSize,
      decoration: BoxDecoration(
        color: Colors.grey[500],
        shape: BoxShape.circle,
        border: Border.all(color: Colors.white, width: 1.5),
        boxShadow: const [BoxShadow(color: Color(0x33000000), blurRadius: 2, offset: Offset(0, 1))],
      ),
      child: Center(
        child: Text(
          '+$overflow',
          style: const TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold, height: 1),
        ),
      ),
    );
  }
}
