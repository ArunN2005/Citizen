import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ScrollView,
  SafeAreaView,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from '../../i18n/useTranslation';
import { makeApiCall, API_BASE_URL } from '../../../config/supabase';

const AppReviewScreen = ({ navigation }) => {
  const { t } = useTranslation();

  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState('');
  const [reviewText, setReviewText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleStarPress = (selectedRating) => {
    setRating(selectedRating);
  };

  const handleSubmit = async () => {
    if (rating === 0) {
      Alert.alert(
        t('appReview.ratingRequired', 'Rating Required'),
        t('appReview.ratingRequiredMessage', 'Please select a star rating before submitting.')
      );
      return;
    }

    setSubmitting(true);

    try {
      const data = await makeApiCall(`${API_BASE_URL}/api/app-review/submit`, {
        method: 'POST',
        body: JSON.stringify({
          rating,
          title: title.trim() || null,
          review_text: reviewText.trim() || null
        })
      });

      if (data.success) {
        Alert.alert(
          t('appReview.thankYou', 'Thank You! 🎉'),
          t('appReview.thankYouMessage', 'Your review helps us make UrbanPulse better for everyone.'),
          [
            {
              text: t('common.ok', 'OK'),
              onPress: () => navigation.goBack()
            }
          ]
        );
        setRating(0);
        setTitle('');
        setReviewText('');
      } else {
        Alert.alert(
          t('common.error', 'Error'),
          data.message || t('appReview.submitError', 'Failed to submit review. Please try again.')
        );
      }
    } catch (error) {
      Alert.alert(
        t('common.error', 'Error'),
        t('appReview.networkError', 'Could not reach the server. Please check your connection.')
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleSkip = () => {
    Alert.alert(
      t('appReview.skipTitle', 'Skip Review?'),
      t('appReview.skipMessage', 'Your feedback helps us improve. Are you sure you want to skip?'),
      [
        { text: t('appReview.leaveReview', 'Leave a Review'), style: 'cancel' },
        {
          text: t('appReview.skip', 'Skip'),
          style: 'destructive',
          onPress: () => navigation.goBack()
        }
      ]
    );
  };

  if (submitting) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>
          {t('appReview.submitting', 'Submitting your review...')}
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* Header */}
        <LinearGradient
          colors={['#4CAF50', '#2E7D32']}
          style={styles.header}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Ionicons name="star" size={48} color="#FFFFFF" style={styles.headerIcon} />
          <Text style={styles.headerTitle}>
            {t('appReview.title', 'Rate UrbanPulse')}
          </Text>
          <Text style={styles.headerSubtitle}>
            {t('appReview.subtitle', 'Share your experience with the app')}
          </Text>
        </LinearGradient>

        {/* Rating Stars */}
        <View style={styles.ratingSection}>
          <Text style={styles.sectionTitle}>
            {t('appReview.ratingPrompt', 'How would you rate your experience?')}
          </Text>
          <View style={styles.starsRow}>
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity
                key={star}
                onPress={() => handleStarPress(star)}
                style={styles.starButton}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={star <= rating ? 'star' : 'star-outline'}
                  size={44}
                  color={star <= rating ? '#FFD700' : '#D1D5DB'}
                />
              </TouchableOpacity>
            ))}
          </View>
          {rating > 0 && (
            <Text style={styles.ratingLabel}>
              {rating === 1 && t('appReview.rating1', 'Not great')}
              {rating === 2 && t('appReview.rating2', 'Could be better')}
              {rating === 3 && t('appReview.rating3', 'It\'s okay')}
              {rating === 4 && t('appReview.rating4', 'Really good!')}
              {rating === 5 && t('appReview.rating5', 'Absolutely love it! ❤️')}
            </Text>
          )}
        </View>

        {/* Review Title */}
        <View style={styles.inputSection}>
          <Text style={styles.sectionTitle}>
            {t('appReview.titlePrompt', 'Give your review a title')}
          </Text>
          <TextInput
            style={styles.titleInput}
            placeholder={t('appReview.titlePlaceholder', 'e.g., Great app for civic engagement!')}
            placeholderTextColor="#9CA3AF"
            value={title}
            onChangeText={setTitle}
            maxLength={100}
          />
        </View>

        {/* Review Text */}
        <View style={styles.inputSection}>
          <Text style={styles.sectionTitle}>
            {t('appReview.reviewPrompt', 'Tell us more (optional)')}
          </Text>
          <TextInput
            style={styles.reviewInput}
            placeholder={t('appReview.reviewPlaceholder', 'What do you like? What could we improve?')}
            placeholderTextColor="#9CA3AF"
            value={reviewText}
            onChangeText={setReviewText}
            multiline
            numberOfLines={5}
            textAlignVertical="top"
            maxLength={500}
          />
          <Text style={styles.charCount}>{reviewText.length}/500</Text>
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitButton, rating === 0 && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          activeOpacity={0.8}
          disabled={rating === 0}
        >
          <LinearGradient
            colors={rating > 0 ? ['#4CAF50', '#2E7D32'] : ['#D1D5DB', '#9CA3AF']}
            style={styles.submitGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Ionicons name="paper-plane" size={20} color="#FFFFFF" style={styles.submitIcon} />
            <Text style={styles.submitText}>
              {t('appReview.submit', 'Submit Review')}
            </Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Skip Link */}
        <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
          <Text style={styles.skipText}>
            {t('appReview.skipReview', 'Skip for now')}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  content: {
    paddingBottom: 40,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 40,
    paddingHorizontal: 24,
    alignItems: 'center',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerIcon: {
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  headerSubtitle: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
  },
  ratingSection: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
    textAlign: 'center',
  },
  starsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  starButton: {
    padding: 4,
  },
  ratingLabel: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  inputSection: {
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  titleInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#1F2937',
  },
  reviewInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#1F2937',
    minHeight: 120,
  },
  charCount: {
    textAlign: 'right',
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
    marginRight: 4,
  },
  submitButton: {
    marginHorizontal: 24,
    marginTop: 8,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  submitButtonDisabled: {
    elevation: 0,
    shadowOpacity: 0,
  },
  submitGradient: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
  },
  submitIcon: {
    marginRight: 8,
  },
  submitText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  skipButton: {
    alignItems: 'center',
    marginTop: 20,
    paddingVertical: 8,
  },
  skipText: {
    fontSize: 15,
    color: '#6B7280',
    textDecorationLine: 'underline',
  },
});

export default AppReviewScreen;