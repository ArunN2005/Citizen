import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../data/complaint_models.dart';
import '../data/complaints_repository.dart';
import 'complaint_feed_screen.dart';
import 'widgets/complaint_card.dart';

final complaintDetailProvider = FutureProvider.family<ComplaintDetail, String>((ref, complaintId) {
  return ref.watch(complaintsRepositoryProvider).getComplaint(complaintId);
});

class ComplaintDetailScreen extends ConsumerWidget {
  const ComplaintDetailScreen({super.key, required this.complaintId});

  final String complaintId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final detail = ref.watch(complaintDetailProvider(complaintId));

    return Scaffold(
      appBar: AppBar(title: const Text('Complaint Details')),
      body: detail.when(
        data: (data) {
          final complaint = data.complaint;
          return RefreshIndicator(
            onRefresh: () async {
              ref.invalidate(complaintDetailProvider(complaintId));
              await ref.read(complaintDetailProvider(complaintId).future);
            },
            child: ListView(
              padding: const EdgeInsets.all(16),
              children: [
                ComplaintCard(complaint: complaint, showAction: false),
                const SizedBox(height: 12),
                Row(
                  children: [
                    Expanded(
                      child: FilledButton.icon(
                        onPressed: () async {
                          await ref.read(complaintsRepositoryProvider).vote(complaintId);
                          ref.invalidate(complaintDetailProvider(complaintId));
                          ref.invalidate(complaintFeedProvider(const ComplaintFeedQuery()));
                        },
                        icon: Icon(complaint.userVoted ? Icons.thumb_up : Icons.thumb_up_outlined),
                        label: Text(complaint.userVoted ? 'Voted' : 'Vote'),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 20),
                Text('Description', style: Theme.of(context).textTheme.titleMedium),
                const SizedBox(height: 8),
                Text(complaint.description ?? 'No description provided'),
                const SizedBox(height: 20),
                Text('Priority', style: Theme.of(context).textTheme.titleMedium),
                const SizedBox(height: 8),
                Text('${data.priorityLevel} (${data.finalScore.toStringAsFixed(2)})'),
                if (data.reasoning != null) ...[
                  const SizedBox(height: 8),
                  Text(data.reasoning!),
                ],
                const SizedBox(height: 20),
                Text('Updates', style: Theme.of(context).textTheme.titleMedium),
                const SizedBox(height: 8),
                if (data.updates.isEmpty)
                  const Text('No updates yet')
                else
                  ...data.updates.map(
                    (update) => ListTile(
                      leading: const Icon(Icons.event_note),
                      title: Text(update.note ?? 'Update'),
                      subtitle: Text(
                        '${update.newStatus ?? '-'}${update.createdAt != null ? ' • ${update.createdAt}' : ''}',
                      ),
                    ),
                  ),
                const SizedBox(height: 20),
                Text('Similar Complaints', style: Theme.of(context).textTheme.titleMedium),
                const SizedBox(height: 8),
                if (data.similarComplaints.isEmpty)
                  const Text('No similar complaints found')
                else
                  ...data.similarComplaints.map(
                    (item) => Padding(
                      padding: const EdgeInsets.only(bottom: 12),
                      child: ComplaintCard(
                        complaint: item,
                        onTap: () => context.push('/complaints/${item.id}'),
                      ),
                    ),
                  ),
              ],
            ),
          );
        },
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, stack) => Center(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Text('Failed to load complaint details: $error'),
          ),
        ),
      ),
    );
  }
}