import "package:openapi/api.dart" as api show AssetEditAction;

enum AssetEditAction { rotate, crop, mirror, adjust, autoEnhance, filter, other }

extension AssetEditActionExtension on AssetEditAction {
  api.AssetEditAction? toDto() {
    return switch (this) {
      AssetEditAction.rotate => api.AssetEditAction.rotate,
      AssetEditAction.crop => api.AssetEditAction.crop,
      AssetEditAction.mirror => api.AssetEditAction.mirror,
      // adjust, autoEnhance, filter will map when OpenAPI is regenerated
      AssetEditAction.adjust => null,
      AssetEditAction.autoEnhance => null,
      AssetEditAction.filter => null,
      AssetEditAction.other => null,
    };
  }
}

class AssetEdit {
  final AssetEditAction action;
  final Map<String, dynamic> parameters;

  const AssetEdit({required this.action, required this.parameters});
}
