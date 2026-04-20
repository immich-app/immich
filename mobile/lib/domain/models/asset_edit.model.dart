import "package:openapi/api.dart" show CropParameters, RotateParameters, MirrorParameters;

enum AssetEditAction { rotate, crop, mirror, other }

sealed class AssetEdit {
  const AssetEdit();
}

class CropEdit extends AssetEdit {
  final CropParameters parameters;

  const CropEdit(this.parameters);
}

class RotateEdit extends AssetEdit {
  final RotateParameters parameters;

  const RotateEdit(this.parameters);
}

class MirrorEdit extends AssetEdit {
  final MirrorParameters parameters;

  const MirrorEdit(this.parameters);
}
