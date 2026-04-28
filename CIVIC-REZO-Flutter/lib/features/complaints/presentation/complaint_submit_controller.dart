import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../data/complaint_models.dart';
import '../data/complaints_api.dart';

class ComplaintSubmitState {
  const ComplaintSubmitState({
    this.loading = false,
    this.error,
    this.preview,
    this.submission,
  });

  final bool loading;
  final String? error;
  final PriorityPreviewResponse? preview;
  final ComplaintSubmitResponse? submission;

  ComplaintSubmitState copyWith({
    bool? loading,
    String? error,
    bool clearError = false,
    PriorityPreviewResponse? preview,
    bool clearPreview = false,
    ComplaintSubmitResponse? submission,
    bool clearSubmission = false,
  }) {
    return ComplaintSubmitState(
      loading: loading ?? this.loading,
      error: clearError ? null : (error ?? this.error),
      preview: clearPreview ? null : (preview ?? this.preview),
      submission: clearSubmission ? null : (submission ?? this.submission),
    );
  }

  static const initial = ComplaintSubmitState();
}

final complaintSubmitControllerProvider =
    StateNotifierProvider<ComplaintSubmitController, ComplaintSubmitState>((ref) {
  return ComplaintSubmitController(ref.watch(complaintsApiProvider));
});

class ComplaintSubmitController extends StateNotifier<ComplaintSubmitState> {
  ComplaintSubmitController(this._api) : super(ComplaintSubmitState.initial);

  final ComplaintsApi _api;

  Future<void> previewPriority({
    required String complaintType,
    required double latitude,
    required double longitude,
  }) async {
    state = state.copyWith(loading: true, clearError: true, clearPreview: true);
    try {
      final result = await _api.previewPriority(
        complaintType: complaintType,
        latitude: latitude,
        longitude: longitude,
      );
      state = state.copyWith(loading: false, preview: result);
    } on DioException catch (e) {
      state = state.copyWith(loading: false, error: _readError(e));
    } catch (_) {
      state = state.copyWith(loading: false, error: 'Failed to preview priority');
    }
  }

  Future<void> submitComplaint(ComplaintDraft draft) async {
    state = state.copyWith(loading: true, clearError: true, clearSubmission: true);
    try {
      final result = await _api.submitComplaint(draft);
      state = state.copyWith(loading: false, submission: result);
    } on DioException catch (e) {
      state = state.copyWith(loading: false, error: _readError(e));
    } catch (_) {
      state = state.copyWith(loading: false, error: 'Failed to submit complaint');
    }
  }

  void resetMessages() {
    state = state.copyWith(clearError: true, clearPreview: true, clearSubmission: true);
  }

  String _readError(DioException e) {
    final body = e.response?.data;
    if (body is Map<String, dynamic>) {
      final message = body['message'] ?? body['error'];
      if (message != null) {
        return message.toString();
      }
    }
    return 'Request failed';
  }
}
