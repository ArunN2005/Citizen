import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/network/api_client.dart';
import 'complaint_models.dart';
import 'image_upload_service.dart';

final complaintsRepositoryProvider = Provider<ComplaintsRepository>((ref) {
  return ComplaintsRepository(ref.watch(dioProvider));
});

final imageUploadServiceProvider = Provider<ImageUploadService>((ref) {
  return ImageUploadService(ref.watch(dioProvider));
});

class ComplaintsRepository {
  ComplaintsRepository(this._dio);

  final Dio _dio;

  Future<ComplaintListResult> getComplaints({
    int page = 1,
    int limit = 20,
    String? status,
    String? category,
    double? latitude,
    double? longitude,
    double? radius,
  }) async {
    final response = await _dio.get<Map<String, dynamic>>(
      '/api/complaints',
      queryParameters: {
        'page': page,
        'limit': limit,
        if (status != null && status.isNotEmpty) 'status': status,
        if (category != null && category.isNotEmpty) 'category': category,
        if (latitude != null) 'latitude': latitude,
        if (longitude != null) 'longitude': longitude,
        if (radius != null) 'radius': radius,
      },
    );

    return ComplaintListResult.fromJson(response.data ?? <String, dynamic>{});
  }

  Future<ComplaintDetail> getComplaint(String id) async {
    final response = await _dio.get<Map<String, dynamic>>('/api/complaints/$id');
    return ComplaintDetail.fromJson(response.data ?? <String, dynamic>{});
  }

  Future<VoteResult> vote(String complaintId) async {
    final response = await _dio.post<Map<String, dynamic>>(
      '/api/complaints/vote',
      data: {'complaintId': complaintId},
    );
    return VoteResult.fromJson(response.data ?? <String, dynamic>{});
  }

  Future<List<ComplaintSummary>> nearby({
    required double latitude,
    required double longitude,
    double distance = 5000,
    int limit = 20,
  }) async {
    final response = await _dio.get<Map<String, dynamic>>(
      '/api/complaints/nearby',
      queryParameters: {
        'latitude': latitude,
        'longitude': longitude,
        'distance': distance,
        'limit': limit,
      },
    );

    final complaints = (response.data?['complaints'] as List? ?? const []);
    return complaints
        .whereType<Map<String, dynamic>>()
        .map(ComplaintSummary.fromJson)
        .toList(growable: false);
  }

  Future<List<ComplaintSummary>> personalReports() async {
    final response = await _dio.get<Map<String, dynamic>>('/api/complaints/personal-reports');
    final data = response.data?['data'] as Map<String, dynamic>? ?? <String, dynamic>{};
    final complaints = (data['complaints'] as List? ?? const []);
    return complaints
        .whereType<Map<String, dynamic>>()
        .map(ComplaintSummary.fromJson)
        .toList(growable: false);
  }

  Future<Map<String, dynamic>> transparencyDashboard() async {
    final response = await _dio.get<Map<String, dynamic>>('/api/transparency/dashboard');
    return response.data?['data'] as Map<String, dynamic>? ?? <String, dynamic>{};
  }
}