import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/network/api_client.dart';
import 'chatbot_models.dart';

final chatbotApiProvider = Provider<ChatbotApi>((ref) {
  return ChatbotApi(ref.watch(dioProvider));
});

class ChatbotApi {
  ChatbotApi(this._dio);

  final Dio _dio;

  Future<List<ChatMessage>> loadHistory(String userId) async {
    final response = await _dio.get<Map<String, dynamic>>('/api/chatbot/history/$userId');
    final messages = (response.data?['messages'] as List? ?? const []);
    return messages
        .whereType<Map<String, dynamic>>()
        .map(ChatMessage.fromHistoryJson)
        .toList(growable: false);
  }

  Future<ChatbotReply> sendMessage({
    required String message,
    required String userId,
    List<Map<String, dynamic>> conversationHistory = const [],
  }) async {
    final response = await _dio.post<Map<String, dynamic>>(
      '/api/chatbot/message',
      data: {
        'message': message,
        'userId': userId,
        'conversationHistory': conversationHistory,
      },
    );

    return ChatbotReply.fromJson(response.data ?? <String, dynamic>{});
  }
}