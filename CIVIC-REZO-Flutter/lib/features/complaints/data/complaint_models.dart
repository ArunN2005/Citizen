class PriorityPreviewResponse {
  PriorityPreviewResponse({
    required this.success,
    required this.priorityScore,
    required this.priorityLevel,
    required this.reasoning,
  });

  final bool success;
  final double priorityScore;
  final String priorityLevel;
  final String reasoning;

  factory PriorityPreviewResponse.fromJson(Map<String, dynamic> json) {
    return PriorityPreviewResponse(
      success: json['success'] == true,
      priorityScore: (json['priorityScore'] as num?)?.toDouble() ?? 0,
      priorityLevel: (json['priorityLevel'] ?? 'LOW').toString(),
      reasoning: (json['reasoning'] ?? '').toString(),
    );
  }
}

class ImageValidationResult {
  ImageValidationResult({
    required this.success,
    required this.confidence,
    required this.modelConfidence,
    required this.openaiConfidence,
    required this.allowUpload,
    required this.message,
    required this.raw,
  });

  final bool success;
  final double confidence;
  final double modelConfidence;
  final double openaiConfidence;
  final bool allowUpload;
  final String message;
  final Map<String, dynamic>? raw;

  double get displayConfidence => modelConfidence >= 0.7 ? modelConfidence : confidence;

  factory ImageValidationResult.fromJson(Map<String, dynamic> json) {
    return ImageValidationResult(
      success: json['success'] == true,
      confidence: (json['confidence'] as num?)?.toDouble() ?? 0,
      modelConfidence: (json['modelConfidence'] as num?)?.toDouble() ?? 0,
      openaiConfidence: (json['openaiConfidence'] as num?)?.toDouble() ?? 0,
      allowUpload: json['allowUpload'] == true,
      message: (json['message'] ?? '').toString(),
      raw: json['raw'] is Map<String, dynamic> ? json['raw'] as Map<String, dynamic> : null,
    );
  }
}

class ComplaintSubmitResponse {
  ComplaintSubmitResponse({
    required this.success,
    required this.id,
    required this.priorityScore,
    required this.priorityLevel,
    required this.status,
  });

  final bool success;
  final String id;
  final int priorityScore;
  final String priorityLevel;
  final String status;

  factory ComplaintSubmitResponse.fromJson(Map<String, dynamic> json) {
    final complaint = (json['complaint'] as Map<String, dynamic>? ?? <String, dynamic>{});
    final analysis = (json['priorityAnalysis'] as Map<String, dynamic>? ?? <String, dynamic>{});

    return ComplaintSubmitResponse(
      success: json['success'] == true,
      id: (complaint['id'] ?? '').toString(),
      priorityScore: (complaint['priorityScore'] as num?)?.toInt() ?? 0,
      priorityLevel: (analysis['priorityLevel'] ?? 'LOW').toString(),
      status: (complaint['status'] ?? 'pending').toString(),
    );
  }
}

class ImageUploadResult {
  ImageUploadResult({required this.url, required this.publicId});

  final String url;
  final String publicId;
}

class ComplaintDraft {
  ComplaintDraft({
    required this.category,
    required this.title,
    required this.description,
    required this.latitude,
    required this.longitude,
    this.imageUrl,
    this.imageValidation,
    this.runSocialScraping = false,
    this.includeSocialDebug = false,
  });

  final String category;
  final String title;
  final String description;
  final double latitude;
  final double longitude;
  final String? imageUrl;
  final ImageValidationResult? imageValidation;
  final bool runSocialScraping;
  final bool includeSocialDebug;
}

class ComplaintSummary {
  ComplaintSummary({
    required this.id,
    required this.title,
    required this.category,
    required this.status,
    required this.priorityScore,
    required this.voteCount,
    required this.userVoted,
    required this.createdAt,
    required this.description,
    required this.imageUrls,
    required this.latitude,
    required this.longitude,
    this.authorName,
    this.authorEmail,
    this.address,
  });

  final String id;
  final String title;
  final String category;
  final String status;
  final double priorityScore;
  final int voteCount;
  final bool userVoted;
  final DateTime? createdAt;
  final String? description;
  final List<String> imageUrls;
  final double? latitude;
  final double? longitude;
  final String? authorName;
  final String? authorEmail;
  final String? address;

  factory ComplaintSummary.fromJson(Map<String, dynamic> json) {
    final users = json['users'];
    final userJson = users is Map<String, dynamic> ? users : <String, dynamic>{};

    final imageUrls = (json['image_urls'] as List?)
            ?.map((item) => item.toString())
            .toList(growable: false) ??
        const <String>[];

    return ComplaintSummary(
      id: (json['id'] ?? '').toString(),
      title: (json['title'] ?? '').toString(),
      category: (json['category'] ?? 'general').toString(),
      status: (json['status'] ?? 'pending').toString(),
      priorityScore: (json['priority_score'] as num?)?.toDouble() ?? 0,
      voteCount: (json['vote_count'] as num?)?.toInt() ?? 0,
      userVoted: json['userVoted'] == true,
      createdAt: DateTime.tryParse((json['created_at'] ?? '').toString()),
      description: json['description']?.toString(),
      imageUrls: imageUrls,
      latitude: (json['location_latitude'] as num?)?.toDouble(),
      longitude: (json['location_longitude'] as num?)?.toDouble(),
      authorName: userJson['full_name']?.toString(),
      authorEmail: userJson['email']?.toString(),
      address: json['location_address']?.toString(),
    );
  }
}

class ComplaintUpdateItem {
  ComplaintUpdateItem({
    required this.id,
    required this.createdAt,
    required this.note,
    required this.newStatus,
    required this.oldStatus,
  });

  final String id;
  final DateTime? createdAt;
  final String? note;
  final String? newStatus;
  final String? oldStatus;

  factory ComplaintUpdateItem.fromJson(Map<String, dynamic> json) {
    return ComplaintUpdateItem(
      id: (json['id'] ?? '').toString(),
      createdAt: DateTime.tryParse((json['created_at'] ?? '').toString()),
      note: (json['update_notes'] ?? json['action_description'])?.toString(),
      newStatus: json['new_status']?.toString(),
      oldStatus: json['old_status']?.toString(),
    );
  }
}

class ComplaintDetail {
  ComplaintDetail({
    required this.complaint,
    required this.updates,
    required this.similarComplaints,
    required this.priorityLevel,
    required this.finalScore,
    this.socialBoost,
    this.reasoning,
  });

  final ComplaintSummary complaint;
  final List<ComplaintUpdateItem> updates;
  final List<ComplaintSummary> similarComplaints;
  final String priorityLevel;
  final double finalScore;
  final double? socialBoost;
  final String? reasoning;

  factory ComplaintDetail.fromJson(Map<String, dynamic> json) {
    final complaintJson = (json['complaint'] as Map<String, dynamic>? ?? json);
    final updatesJson = (complaintJson['updates'] as List? ?? const []);
    final similarJson = (complaintJson['similarComplaints'] as List? ?? const []);
    final priorityBreakdown = complaintJson['priority_breakdown'] as Map<String, dynamic>?;
    final socialSignals = complaintJson['social_signals'] as Map<String, dynamic>?;

    return ComplaintDetail(
      complaint: ComplaintSummary.fromJson(complaintJson),
      updates: updatesJson
          .whereType<Map<String, dynamic>>()
          .map(ComplaintUpdateItem.fromJson)
          .toList(growable: false),
      similarComplaints: similarJson
          .whereType<Map<String, dynamic>>()
          .map(ComplaintSummary.fromJson)
          .toList(growable: false),
      priorityLevel: (priorityBreakdown?['priorityLevel'] ?? complaintJson['priority_level'] ?? 'LOW').toString(),
      finalScore: (priorityBreakdown?['finalScore'] as num?)?.toDouble() ??
          (complaintJson['priority_score'] as num?)?.toDouble() ??
          0,
      socialBoost: (socialSignals?['socialBoost'] as num?)?.toDouble(),
      reasoning: priorityBreakdown?['reasoning']?.toString(),
    );
  }
}

class ComplaintListResult {
  ComplaintListResult({required this.complaints, this.total, this.page, this.limit, this.pages});

  final List<ComplaintSummary> complaints;
  final int? total;
  final int? page;
  final int? limit;
  final int? pages;

  factory ComplaintListResult.fromJson(Map<String, dynamic> json) {
    final complaintsJson = (json['complaints'] as List? ?? const []);
    final pagination = json['pagination'] as Map<String, dynamic>?;

    return ComplaintListResult(
      complaints: complaintsJson
          .whereType<Map<String, dynamic>>()
          .map(ComplaintSummary.fromJson)
          .toList(growable: false),
      total: (pagination?['total'] as num?)?.toInt(),
      page: (pagination?['page'] as num?)?.toInt(),
      limit: (pagination?['limit'] as num?)?.toInt(),
      pages: (pagination?['pages'] as num?)?.toInt(),
    );
  }
}

class VoteResult {
  VoteResult({required this.success, required this.message, required this.voteCount, required this.userVoted});

  final bool success;
  final String message;
  final int voteCount;
  final bool userVoted;

  factory VoteResult.fromJson(Map<String, dynamic> json) {
    final data = (json['data'] as Map<String, dynamic>? ?? <String, dynamic>{});
    return VoteResult(
      success: json['success'] == true,
      message: (json['message'] ?? '').toString(),
      voteCount: (data['voteCount'] as num?)?.toInt() ?? 0,
      userVoted: data['userVoted'] == true,
    );
  }
}
