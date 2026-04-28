import 'package:flutter_dotenv/flutter_dotenv.dart';

class AppEnv {
  static const String apiBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'http://10.0.2.2:3001',
  );

  static String get apiBaseUrlFromEnv {
    return dotenv.env['API_BASE_URL'] ?? apiBaseUrl;
  }
}
