import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/network/api_client.dart';
import 'auth_models.dart';

final authApiProvider = Provider<AuthApi>((ref) {
  return AuthApi(ref.watch(dioProvider));
});

class AuthApi {
  AuthApi(this._dio);

  final Dio _dio;

  Future<AuthSuccess> login({
    required String email,
    required String password,
  }) async {
    final response = await _dio.post<Map<String, dynamic>>(
      '/api/auth/login',
      data: {
        'email': email,
        'password': password,
      },
    );

    return AuthSuccess.fromEnvelope(response.data ?? <String, dynamic>{});
  }

  Future<AuthSuccess> signup({
    required String email,
    required String password,
    required String fullName,
    required String phoneNumber,
    required String userType,
    String? address,
  }) async {
    final response = await _dio.post<Map<String, dynamic>>(
      '/api/auth/signup',
      data: {
        'email': email,
        'password': password,
        'fullName': fullName,
        'phoneNumber': phoneNumber,
        'userType': userType,
        'address': address,
      },
    );

    return AuthSuccess.fromEnvelope(response.data ?? <String, dynamic>{});
  }

  Future<AppUser> profile() async {
    final response = await _dio.get<Map<String, dynamic>>('/api/auth/profile');
    final data = (response.data?['data'] as Map<String, dynamic>? ?? <String, dynamic>{});
    final userJson = (data['user'] as Map<String, dynamic>? ?? <String, dynamic>{});
    return AppUser.fromJson(userJson);
  }
}
