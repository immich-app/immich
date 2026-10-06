import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/constants/enums.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/presentation/actions/action.dart';
import 'package:immich_mobile/providers/infrastructure/toast.provider.dart';
import 'package:immich_mobile/repositories/memorydock_style_transform.repository.dart';

const _ghibliStyle = 'ghibli';
const _styleTransformLabel = 'AI风格转变';
const _ghibliStyleLabel = '吉卜力动画';
const _styleTransformSuccess = 'AI风格图已生成并已添加到照片';
const _styleTransformFailure = 'AI风格转变提交失败';

final _stateProvider = Provider.family.autoDispose<RemoteAsset?, ActionSource>((ref, source) {
  final imageAssets = ref
      .watch(ownedAssetsActionProvider(source))
      .remote()
      .where((asset) => asset.isImage)
      .toList(growable: false);
  return imageAssets.length == 1 ? imageAssets.first : null;
}, dependencies: [ownedAssetsActionProvider]);

class StyleTransformAction extends AssetActionBuilder {
  const StyleTransformAction({required super.source});

  @override
  ActionItem? create(BuildContext context, WidgetRef ref) {
    if (ref.watch(_stateProvider(source)) == null) {
      return null;
    }

    return .new(icon: Icons.auto_fix_high_rounded, label: _styleTransformLabel, onAction: () => _prompt(context, ref));
  }

  Future<void> _prompt(BuildContext context, WidgetRef ref) async {
    final confirmed = await showDialog<bool>(
      context: context,
      useRootNavigator: false,
      builder: (_) => const _StyleTransformDialog(),
    );
    if (confirmed != true || !context.mounted) {
      return;
    }

    final asset = ref.read(_stateProvider(source));
    if (asset == null) {
      return;
    }

    final repository = ref.read(memoryDockStyleTransformRepositoryProvider);
    final toastService = ref.read(toastServiceProvider);
    try {
      await repository.submit(assetId: asset.id, style: _ghibliStyle);
      toastService.success(_styleTransformSuccess);
    } catch (_) {
      toastService.error(_styleTransformFailure);
    }
  }
}

class _StyleTransformDialog extends StatelessWidget {
  const _StyleTransformDialog();

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: const Text(_styleTransformLabel),
      contentPadding: const EdgeInsets.only(top: 12, bottom: 8),
      content: const ListTile(leading: Icon(Icons.auto_fix_high_rounded), title: Text(_ghibliStyleLabel)),
      actions: [
        TextButton(onPressed: () => context.pop(false), child: const Text('取消')),
        TextButton(onPressed: () => context.pop(true), child: const Text('生成')),
      ],
    );
  }
}
