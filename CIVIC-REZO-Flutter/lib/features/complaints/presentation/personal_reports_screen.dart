import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../data/complaint_models.dart';
import '../data/complaints_repository.dart';

final personalReportsProvider = FutureProvider<List<ComplaintSummary>>((ref) {
  return ref.watch(complaintsRepositoryProvider).personalReports();
});

class PersonalReportsScreen extends ConsumerWidget {
  const PersonalReportsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final reports = ref.watch(personalReportsProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('My Reports'),
        actions: [
          IconButton(
            onPressed: () => ref.refresh(personalReportsProvider),
            icon: const Icon(Icons.refresh),
          ),
        ],
      ),
      body: reports.when(
        data: (items) {
          if (items.isEmpty) {
            return const Center(child: Text('You have not submitted any complaints yet'));
          }

          return ListView.separated(
            padding: const EdgeInsets.all(16),
            itemCount: items.length,
            separatorBuilder: (_, __) => const SizedBox(height: 12),
            itemBuilder: (context, index) {
              final item = items[index];
              return Card(
                child: ListTile(
                  leading: Icon(_stageIcon(item.status)),
                  title: Text(item.title),
                  subtitle: Text('${item.category} • ${item.status}'),
                  trailing: Text('${item.voteCount} votes'),
                ),
              );
            },
          );
        },
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, stack) => Center(child: Text('Failed to load personal reports: $error')),
      ),
    );
  }

  IconData _stageIcon(String status) {
    switch (status) {
      case 'resolved':
      case 'completed':
        return Icons.check_circle;
      case 'in_progress':
        return Icons.timelapse;
      default:
        return Icons.pending;
    }
  }
}