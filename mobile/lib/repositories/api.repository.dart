import 'package:immich_mobile/constants/errors.dart';

abstract class ApiRepository {
  Future<T> checkNull<T>(Future<T?> future) async {
    final response = await future;
    if (response == null) throw const NoResponseDtoError();
    return response;
  }
}
