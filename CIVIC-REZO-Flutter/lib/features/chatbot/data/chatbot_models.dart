class ChatMessage {
  ChatMessage({
    required this.role,
    required this.text,
    this.confidence,
    this.category,
  });

  final String role;
  final String text;
  final double? confidence;
  final String? category;

  factory ChatMessage.fromHistoryJson(Map<String, dynamic> json) {
    return ChatMessage(
      role: (json['type'] ?? 'bot').toString(),
      text: (json['text'] ?? '').toString(),
      confidence: (json['confidence'] as num?)?.toDouble(),
      category: json['category']?.toString(),
    );
  }
}

class ChatbotReply {
  ChatbotReply({
    required this.reply,
    required this.confidence,
    required this.category,
    required this.suggestedActions,
  });

  final String reply;
  final double confidence;
  final String category;
  final List<Map<String, dynamic>> suggestedActions;

  factory ChatbotReply.fromJson(Map<String, dynamic> json) {
    return ChatbotReply(
      reply: (json['reply'] ?? '').toString(),
      confidence: (json['confidence'] as num?)?.toDouble() ?? 0,
      category: (json['category'] ?? 'general').toString(),
      suggestedActions: (json['suggestedActions'] as List? ?? const [])
          .whereType<Map<String, dynamic>>()
          .toList(growable: false),
    );
  }
}