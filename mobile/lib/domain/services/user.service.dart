import 'package:immich_mobile/domain/interfaces/user.interface.dart';
import 'package:immich_mobile/domain/models/user.model.dart';

class UserService {
  final IUserRepository _userRepo;

  const UserService({required IUserRepository userRepo}) : _userRepo = userRepo;

  Future<User> updateUser(User user) => _userRepo.update(user);
}
