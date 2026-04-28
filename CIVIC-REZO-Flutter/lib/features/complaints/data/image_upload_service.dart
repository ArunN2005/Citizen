import 'dart:io';

import 'package:dio/dio.dart';

import 'complaint_models.dart';

class ImageUploadService {
  ImageUploadService(this._dio);

  final Dio _dio;

  Future<ImageUploadResult> uploadToCloudinary(File file) async {
    final formData = FormData.fromMap({
      'file': await MultipartFile.fromFile(file.path),
    });

    final response = await _dio.post<Map<String, dynamic>>(
      '/cloudinary/upload-image',
      data: formData,
      options: Options(contentType: 'multipart/form-data'),
    );

    final data = response.data ?? <String, dynamic>{};
    return ImageUploadResult(
      url: ((data['data'] as Map<String, dynamic>?)?['secure_url'] ?? data['secure_url'] ?? data['url'] ?? '').toString(),
      publicId: ((data['data'] as Map<String, dynamic>?)?['public_id'] ?? data['public_id'] ?? '').toString(),
    );
  }
}