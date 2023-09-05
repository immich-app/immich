import 'package:openapi/api.dart';

String serverVersionReponseDtoToString(ServerVersionResponseDto dto) {
  return "${dto.major}.${dto.minor}.${dto.patch_}";
}
