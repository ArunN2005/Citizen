class AppUser {
  AppUser({
    required this.id,
    required this.email,
    required this.fullName,
    required this.phoneNumber,
    required this.userType,
    this.address,
  });

  final String id;
  final String email;
  final String fullName;
  final String phoneNumber;
  final String userType;
  final String? address;

  factory AppUser.fromJson(Map<String, dynamic> json) {
    return AppUser(
      id: (json['id'] ?? '').toString(),
      email: (json['email'] ?? '').toString(),
      fullName: (json['fullName'] ?? '').toString(),
      phoneNumber: (json['phoneNumber'] ?? '').toString(),
      userType: (json['userType'] ?? '').toString(),
      address: json['address']?.toString(),
    );
  }
}

class AuthSuccess {
  AuthSuccess({required this.user, required this.token});

  final AppUser user;
  final String token;

  factory AuthSuccess.fromEnvelope(Map<String, dynamic> json) {
    final data = (json['data'] as Map<String, dynamic>? ?? <String, dynamic>{});
    final userJson = (data['user'] as Map<String, dynamic>? ?? <String, dynamic>{});
    return AuthSuccess(
      user: AppUser.fromJson(userJson),
      token: (data['token'] ?? '').toString(),
    );
  }
}
