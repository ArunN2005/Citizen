import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/network/api_client.dart';
import 'complaint_models.dart';

final complaintsApiProvider = Provider<ComplaintsApi>((ref) {
  return ComplaintsApi(ref.watch(dioProvider));
});

class ComplaintsApi {
  ComplaintsApi(this._dio);

  final Dio _dio;

  Future<PriorityPreviewResponse> previewPriority({
    required String complaintType,
    required double latitude,
    required double longitude,
  }) async {
    final response = await _dio.post<Map<String, dynamic>>(
      '/api/location-priority/calculate',
      data: {
        'latitude': latitude,
        'longitude': longitude,
        'complaintType': complaintType,
        'locationMeta': {
          'privacyLevel': 'street',
          'radiusM': 25,
          'precision': 'street',
          'description': 'Flutter preview location'
        }
      },
    );

    return PriorityPreviewResponse.fromJson(response.data ?? <String, dynamic>{});
  }

  Future<ImageValidationResult> validateImage({required String imageUrl}) async {
    final response = await _dio.post<Map<String, dynamic>>(
      '/api/image-analysis/validate-image',
      data: {'imageUrl': imageUrl},
    );

    return ImageValidationResult.fromJson(response.data ?? <String, dynamic>{});
  }

  Future<ComplaintSubmitResponse> submitComplaint(ComplaintDraft draft) async {
    final response = await _dio.post<Map<String, dynamic>>(
      '/api/complaints/submit',
      data: {
        'title': draft.title,
        'description': draft.description,
        'category': draft.category,
        'imageUrl': draft.imageUrl,
        'imageValidation': draft.imageValidation == null
            ? null
            : {
                'confidence': draft.imageValidation!.confidence,
                'modelConfidence': draft.imageValidation!.modelConfidence,
                'openaiConfidence': draft.imageValidation!.openaiConfidence,
                'allowUpload': draft.imageValidation!.allowUpload,
                'message': draft.imageValidation!.message,
                'raw': draft.imageValidation!.raw,
              },
        'locationData': {
          'latitude': draft.latitude,
          'longitude': draft.longitude,
          'privacyLevel': 'street',
          'accuracy': 25,
          'precision': 'street',
          'description': 'Reported from Flutter app'
        },
        'runSocialScraping': draft.runSocialScraping,
        'includeSocialDebug': draft.includeSocialDebug,
        'userType': 'citizen'
      },
    );

    return ComplaintSubmitResponse.fromJson(response.data ?? <String, dynamic>{});
  }
}
