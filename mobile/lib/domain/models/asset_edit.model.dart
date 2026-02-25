import "package:openapi/api.dart" as api show AssetEditAction;

enum AssetEditAction { rotate, crop, mirror, other }

extension AssetEditActionExtension on AssetEditAction {
  api.AssetEditAction? toDto() {
    return switch (this) {
      AssetEditAction.rotate => api.AssetEditAction.rotate,
      AssetEditAction.crop => api.AssetEditAction.crop,
      AssetEditAction.mirror => api.AssetEditAction.mirror,
      AssetEditAction.other => null,
    };
  }
}

class AssetEdit {
  final AssetEditAction action;
  final Map<String, dynamic> parameters;

  const AssetEdit({required this.action, required this.parameters});
}
