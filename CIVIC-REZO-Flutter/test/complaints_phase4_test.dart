import 'package:civic_rezo_flutter/features/complaints/data/complaint_models.dart';
import 'package:civic_rezo_flutter/features/complaints/presentation/widgets/complaint_card.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  test('ComplaintSummary parses complaint payload', () {
    final complaint = ComplaintSummary.fromJson({
      'id': 'c1',
      'title': 'Broken streetlight',
      'category': 'streetlight',
      'status': 'pending',
      'priority_score': 0.82,
      'vote_count': 7,
      'userVoted': true,
      'created_at': '2026-04-28T10:00:00.000Z',
      'description': 'Streetlight near school is broken',
      'image_urls': ['https://example.com/a.png'],
      'location_latitude': 11.0,
      'location_longitude': 77.0,
      'users': {
        'full_name': 'Asha',
        'email': 'asha@example.com',
      }
    });

    expect(complaint.id, 'c1');
    expect(complaint.priorityScore, 0.82);
    expect(complaint.userVoted, isTrue);
    expect(complaint.authorName, 'Asha');
  });

  testWidgets('ComplaintCard shows title and votes', (tester) async {
    final complaint = ComplaintSummary.fromJson({
      'id': 'c2',
      'title': 'Pothole on main road',
      'category': 'pothole',
      'status': 'in_progress',
      'priority_score': 0.65,
      'vote_count': 11,
      'userVoted': false,
      'created_at': '2026-04-28T10:00:00.000Z',
      'description': 'Large pothole near junction',
      'image_urls': [],
    });

    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: ComplaintCard(complaint: complaint),
        ),
      ),
    );

    expect(find.text('Pothole on main road'), findsOneWidget);
    expect(find.textContaining('11 votes'), findsOneWidget);
    expect(find.textContaining('0.65'), findsOneWidget);
  });
}
