import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/storage/token_storage.dart';
import '../data/auth_api.dart';
import '../data/auth_models.dart';

class AuthState {
  const AuthState({
    required this.initialized,
    required this.loading,
    this.user,
    this.token,
    this.error,
  });

  final bool initialized;
  final bool loading;
  final AppUser? user;
  final String? token;
  final String? error;

  bool get isAuthenticated => token != null && token!.isNotEmpty && user != null;

  AuthState copyWith({
    bool? initialized,
    bool? loading,
    AppUser? user,
    String? token,
    String? error,
    bool clearError = false,
    bool clearUser = false,
    bool clearToken = false,
  }) {
    return AuthState(
      initialized: initialized ?? this.initialized,
      loading: loading ?? this.loading,
      user: clearUser ? null : (user ?? this.user),
      token: clearToken ? null : (token ?? this.token),
      error: clearError ? null : (error ?? this.error),
    );
  }

  static const initial = AuthState(initialized: false, loading: false);
}

final authControllerProvider = StateNotifierProvider<AuthController, AuthState>((ref) {
  return AuthController(
    ref.watch(authApiProvider),
    ref.watch(tokenStorageProvider),
  );
});

class AuthController extends StateNotifier<AuthState> {
  AuthController(this._api, this._tokenStorage) : super(AuthState.initial);

  final AuthApi _api;
  final TokenStorage _tokenStorage;

  Future<void> initialize() async {
    if (state.initialized) {
      return;
    }

    state = state.copyWith(loading: true, clearError: true);

    try {
      final token = await _tokenStorage.readToken();
      if (token == null || token.isEmpty) {
        state = state.copyWith(initialized: true, loading: false, clearToken: true, clearUser: true);
        return;
      }

      final user = await _api.profile();
      state = state.copyWith(
        initialized: true,
        loading: false,
        token: token,
        user: user,
        clearError: true,
      );
    } on DioException catch (e) {
      await _tokenStorage.clearToken();
      state = state.copyWith(
        initialized: true,
        loading: false,
        clearToken: true,
        clearUser: true,
        error: _readDioError(e),
      );
    } catch (_) {
      await _tokenStorage.clearToken();
      state = state.copyWith(
        initialized: true,
        loading: false,
        clearToken: true,
        clearUser: true,
        error: 'Failed to initialize session',
      );
    }
  }

  Future<void> login({required String email, required String password}) async {
    state = state.copyWith(loading: true, clearError: true);
    try {
      final result = await _api.login(email: email, password: password);
      await _tokenStorage.saveToken(result.token);
      state = state.copyWith(loading: false, token: result.token, user: result.user, initialized: true);
    } on DioException catch (e) {
      state = state.copyWith(loading: false, error: _readDioError(e));
    } catch (_) {
      state = state.copyWith(loading: false, error: 'Login failed. Please try again.');
    }
  }

  Future<void> signup({
    required String email,
    required String password,
    required String fullName,
    required String phoneNumber,
    String userType = 'citizen',
    String? address,
  }) async {
    state = state.copyWith(loading: true, clearError: true);
    try {
      final result = await _api.signup(
        email: email,
        password: password,
        fullName: fullName,
        phoneNumber: phoneNumber,
        userType: userType,
        address: address,
      );
      await _tokenStorage.saveToken(result.token);
      state = state.copyWith(loading: false, token: result.token, user: result.user, initialized: true);
    } on DioException catch (e) {
      state = state.copyWith(loading: false, error: _readDioError(e));
    } catch (_) {
      state = state.copyWith(loading: false, error: 'Signup failed. Please try again.');
    }
  }

  Future<void> logout() async {
    await _tokenStorage.clearToken();
    state = state.copyWith(clearToken: true, clearUser: true, clearError: true, initialized: true, loading: false);
  }

  String _readDioError(DioException e) {
    final body = e.response?.data;
    if (body is Map<String, dynamic>) {
      final message = body['message'] ?? body['error'];
      if (message != null) {
        return message.toString();
      }
    }
    return 'Network request failed';
  }
}
