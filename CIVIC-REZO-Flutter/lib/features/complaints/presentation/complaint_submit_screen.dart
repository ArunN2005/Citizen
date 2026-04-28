import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:image_picker/image_picker.dart';

import '../data/complaint_models.dart';
import '../data/complaints_repository.dart';
import 'complaint_submit_controller.dart';

class ComplaintSubmitScreen extends ConsumerStatefulWidget {
  const ComplaintSubmitScreen({super.key});

  @override
  ConsumerState<ComplaintSubmitScreen> createState() => _ComplaintSubmitScreenState();
}

class _ComplaintSubmitScreenState extends ConsumerState<ComplaintSubmitScreen> {
  final _formKey = GlobalKey<FormState>();
  final _categoryController = TextEditingController(text: 'pothole');
  final _titleController = TextEditingController();
  final _descriptionController = TextEditingController();
  final _latitudeController = TextEditingController();
  final _longitudeController = TextEditingController();
  final _imageUrlController = TextEditingController();
  final _imagePicker = ImagePicker();

  XFile? _selectedImage;
  bool _uploadingImage = false;

  @override
  void dispose() {
    _categoryController.dispose();
    _titleController.dispose();
    _descriptionController.dispose();
    _latitudeController.dispose();
    _longitudeController.dispose();
    _imageUrlController.dispose();
    super.dispose();
  }

  Future<void> _pickImage(ImageSource source) async {
    final picked = await _imagePicker.pickImage(source: source, imageQuality: 85, maxWidth: 1600);
    if (picked == null) {
      return;
    }

    setState(() {
      _selectedImage = picked;
      _imageUrlController.clear();
    });

    await _uploadSelectedImage();
  }

  Future<void> _uploadSelectedImage() async {
    final selected = _selectedImage;
    if (selected == null) return;

    setState(() {
      _uploadingImage = true;
    });

    try {
      final result = await ref.read(imageUploadServiceProvider).uploadToCloudinary(
            File(selected.path),
          );
      if (!mounted) return;
      setState(() {
        _imageUrlController.text = result.url;
      });
    } catch (error) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Image upload failed: $error')),
      );
    } finally {
      if (mounted) {
        setState(() {
          _uploadingImage = false;
        });
      }
    }
  }

  double? _asDouble(String text) => double.tryParse(text.trim());

  Future<void> _previewPriority() async {
    if (!_formKey.currentState!.validate()) return;

    final lat = _asDouble(_latitudeController.text);
    final lng = _asDouble(_longitudeController.text);
    if (lat == null || lng == null) return;

    await ref.read(complaintSubmitControllerProvider.notifier).previewPriority(
          complaintType: _categoryController.text.trim(),
          latitude: lat,
          longitude: lng,
        );
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;

    final lat = _asDouble(_latitudeController.text);
    final lng = _asDouble(_longitudeController.text);
    if (lat == null || lng == null) return;

    final draft = ComplaintDraft(
      category: _categoryController.text.trim(),
      title: _titleController.text.trim(),
      description: _descriptionController.text.trim(),
      latitude: lat,
      longitude: lng,
      imageUrl: _imageUrlController.text.trim().isEmpty ? null : _imageUrlController.text.trim(),
    );

    await ref.read(complaintSubmitControllerProvider.notifier).submitComplaint(draft);
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(complaintSubmitControllerProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Submit Complaint')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Form(
          key: _formKey,
          child: Column(
            children: [
              TextFormField(
                controller: _categoryController,
                decoration: const InputDecoration(labelText: 'Category'),
                validator: (v) => v == null || v.trim().isEmpty ? 'Category required' : null,
              ),
              const SizedBox(height: 10),
              TextFormField(
                controller: _titleController,
                decoration: const InputDecoration(labelText: 'Title'),
                validator: (v) => v == null || v.trim().isEmpty ? 'Title required' : null,
              ),
              const SizedBox(height: 10),
              TextFormField(
                controller: _descriptionController,
                minLines: 3,
                maxLines: 5,
                decoration: const InputDecoration(labelText: 'Description'),
                validator: (v) => v == null || v.trim().isEmpty ? 'Description required' : null,
              ),
              const SizedBox(height: 10),
              TextFormField(
                controller: _latitudeController,
                keyboardType: const TextInputType.numberWithOptions(decimal: true, signed: true),
                decoration: const InputDecoration(labelText: 'Latitude'),
                validator: (v) => _asDouble(v ?? '') == null ? 'Valid latitude required' : null,
              ),
              const SizedBox(height: 10),
              TextFormField(
                controller: _longitudeController,
                keyboardType: const TextInputType.numberWithOptions(decimal: true, signed: true),
                decoration: const InputDecoration(labelText: 'Longitude'),
                validator: (v) => _asDouble(v ?? '') == null ? 'Valid longitude required' : null,
              ),
              const SizedBox(height: 10),
              TextFormField(
                controller: _imageUrlController,
                decoration: const InputDecoration(labelText: 'Image URL (optional)'),
              ),
              const SizedBox(height: 10),
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton.icon(
                      onPressed: _uploadingImage ? null : () => _pickImage(ImageSource.camera),
                      icon: const Icon(Icons.camera_alt),
                      label: const Text('Camera'),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: OutlinedButton.icon(
                      onPressed: _uploadingImage ? null : () => _pickImage(ImageSource.gallery),
                      icon: const Icon(Icons.photo_library),
                      label: const Text('Gallery'),
                    ),
                  ),
                ],
              ),
              if (_selectedImage != null) ...[
                const SizedBox(height: 12),
                ClipRRect(
                  borderRadius: BorderRadius.circular(12),
                  child: Stack(
                    children: [
                      Image.file(
                        File(_selectedImage!.path),
                        height: 180,
                        width: double.infinity,
                        fit: BoxFit.cover,
                      ),
                      if (_uploadingImage)
                        Positioned.fill(
                          child: Container(
                            color: Colors.black45,
                            alignment: Alignment.center,
                            child: const CircularProgressIndicator(),
                          ),
                        ),
                    ],
                  ),
                ),
              ],
              const SizedBox(height: 16),
              if (state.error != null)
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(10),
                  margin: const EdgeInsets.only(bottom: 10),
                  color: Colors.red.shade50,
                  child: Text(
                    state.error!,
                    style: TextStyle(color: Colors.red.shade800),
                  ),
                ),
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton(
                      onPressed: state.loading ? null : _previewPriority,
                      child: const Text('Preview Priority'),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: FilledButton(
                      onPressed: state.loading ? null : _submit,
                      child: state.loading
                          ? const SizedBox(
                              width: 20,
                              height: 20,
                              child: CircularProgressIndicator(strokeWidth: 2),
                            )
                          : const Text('Submit'),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              if (state.preview != null)
                Card(
                  child: ListTile(
                    title: Text('Priority: ${state.preview!.priorityLevel} (${state.preview!.priorityScore.toStringAsFixed(2)})'),
                    subtitle: Text(state.preview!.reasoning),
                  ),
                ),
              if (state.submission != null)
                Card(
                  color: Colors.green.shade50,
                  child: ListTile(
                    title: Text('Submitted: ${state.submission!.id}'),
                    subtitle: Text(
                      'Status: ${state.submission!.status} | Priority: ${state.submission!.priorityLevel} (${state.submission!.priorityScore})',
                    ),
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }
}
