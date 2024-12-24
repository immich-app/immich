class LoginResponse {
  final String accessToken;

  final bool isAdmin;

  final String name;

  final String profileImagePath;

  final bool shouldChangePassword;

  final String userEmail;

  final String userId;

  LoginResponse({
    required this.accessToken,
    required this.isAdmin,
    required this.name,
    required this.profileImagePath,
    required this.shouldChangePassword,
    required this.userEmail,
    required this.userId,
  });

  @override
  String toString() {
    return 'LoginResponse[accessToken=$accessToken, isAdmin=$isAdmin, name=$name, profileImagePath=$profileImagePath, shouldChangePassword=$shouldChangePassword, userEmail=$userEmail, userId=$userId]';
  }
}
