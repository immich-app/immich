import 'package:immich_mobile/constants/errors.dart';

class ApiRepository {
  const ApiRepository();

  Future<T> checkNull<T>(Future<T?> future) async {
    final response = await future;
    if (response == null) throw NoResponseDtoError();
    return response;
  }
}
