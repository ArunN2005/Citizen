import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { apiClient, makeApiCall } from '../../../config/supabase';

const AdminSignupScreen = ({ navigation }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    phoneNumber: '',
    department: '',
    employeeId: '',
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const validateForm = () => {
    if (!formData.email || !formData.password || !formData.fullName || 
        !formData.phoneNumber || !formData.department || !formData.employeeId) {
      Alert.alert('Error', 'Please fill in all required fields');
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return false;
    }

    if (formData.password.length < 8) {
      Alert.alert('Error', 'Admin password must be at least 8 characters long');
      return false;
    }

    if (!formData.email.includes('@')) {
      Alert.alert('Error', 'Please enter a valid email address');
      return false;
    }

    if (!formData.email.includes('gov') && !formData.email.includes('civic')) {
      Alert.alert(
        'Warning', 
        'Admin accounts typically use government or organizational email addresses. Continue anyway?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Continue', onPress: () => null }
        ]
      );
    }

    return true;
  };

  const handleSignup = async () => {
    if (!validateForm()) return;

    Alert.alert(
      'Admin Registration',
      'Admin accounts require approval. Your registration will be reviewed by system administrators.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Proceed', 
          onPress: async () => {
            setLoading(true);
            try {
              const signupData = {
                ...formData,
                userType: 'admin',
                address: `Department: ${formData.department}, Employee ID: ${formData.employeeId}`,
              };
              delete signupData.confirmPassword;
              delete signupData.department;
              delete signupData.employeeId;

              const response = await makeApiCall(apiClient.auth.signup, {
                method: 'POST',
                body: JSON.stringify(signupData),
              });

              if (response.success) {
                Alert.alert(
                  'Registration Submitted',
                  'Your admin registration has been submitted for approval.',
                  [
                    {
                      text: 'OK',
                      onPress: () => navigation.navigate('AdminLogin'),
                    },
                  ]
                );
              }
            } catch (error) {
              Alert.alert('Error', error.message || 'Registration failed');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const fields = [
    { key: 'fullName', label: 'FULL NAME', placeholder: 'Enter full name', icon: 'person-outline', required: true },
    { key: 'email', label: 'OFFICIAL EMAIL', placeholder: 'Enter email', icon: 'mail-outline', keyboard: 'email-address', required: true },
    { key: 'department', label: 'DEPARTMENT', placeholder: 'Enter department', icon: 'business-outline', required: true },
    { key: 'employeeId', label: 'EMPLOYEE ID', placeholder: 'Enter employee ID', icon: 'card-outline', required: true },
    { key: 'phoneNumber', label: 'PHONE NUMBER', placeholder: 'Enter phone', icon: 'call-outline', keyboard: 'phone-pad', required: true },
  ];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FAFAFA" />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={20} color="#374151" />
        </TouchableOpacity>

        <View style={styles.header}>
          <Text style={styles.title}>Admin Registration</Text>
          <Text style={styles.subtitle}>Request administrator access to the platform</Text>
        </View>

        {/* Warning */}
        <View style={styles.noticeCard}>
          <Ionicons name="information-circle-outline" size={18} color="#1A1A1A" />
          <Text style={styles.noticeText}>
            Admin registrations require approval. Please provide accurate information for verification.
          </Text>
        </View>

        {/* Fields */}
        {fields.map((field) => (
          <View key={field.key} style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>
              {field.label} {field.required && <Text style={styles.required}>*</Text>}
            </Text>
            <View style={styles.inputContainer}>
              <Ionicons name={field.icon} size={18} color="#9CA3AF" />
              <TextInput
                style={styles.input}
                placeholder={field.placeholder}
                value={formData[field.key]}
                onChangeText={(value) => handleInputChange(field.key, value)}
                keyboardType={field.keyboard || 'default'}
                autoCapitalize={field.keyboard === 'email-address' ? 'none' : 'words'}
                placeholderTextColor="#9CA3AF"
              />
            </View>
          </View>
        ))}

        {/* Password */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>PASSWORD <Text style={styles.required}>*</Text></Text>
          <View style={styles.inputContainer}>
            <Ionicons name="lock-closed-outline" size={18} color="#9CA3AF" />
            <TextInput
              style={styles.input}
              placeholder="Min 8 characters"
              value={formData.password}
              onChangeText={(value) => handleInputChange('password', value)}
              secureTextEntry={!showPassword}
              placeholderTextColor="#9CA3AF"
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <Ionicons name={showPassword ? 'eye-outline' : 'eye-off-outline'} size={18} color="#9CA3AF" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>CONFIRM PASSWORD <Text style={styles.required}>*</Text></Text>
          <View style={styles.inputContainer}>
            <Ionicons name="lock-closed-outline" size={18} color="#9CA3AF" />
            <TextInput
              style={styles.input}
              placeholder="Re-enter password"
              value={formData.confirmPassword}
              onChangeText={(value) => handleInputChange('confirmPassword', value)}
              secureTextEntry={!showConfirmPassword}
              placeholderTextColor="#9CA3AF"
            />
            <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
              <Ionicons name={showConfirmPassword ? 'eye-outline' : 'eye-off-outline'} size={18} color="#9CA3AF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Requirements */}
        <View style={styles.requirementsCard}>
          <Text style={styles.requirementsTitle}>REQUIRED FOR ADMIN ACCESS</Text>
          <Text style={styles.requirementItem}>Valid government/organizational email</Text>
          <Text style={styles.requirementItem}>Official department information</Text>
          <Text style={styles.requirementItem}>Employee identification</Text>
          <Text style={styles.requirementItem}>Verification by system admin</Text>
        </View>

        {/* Submit */}
        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitDisabled]}
          onPress={handleSignup}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <View style={styles.submitContent}>
              <Text style={styles.submitText}>SUBMIT REGISTRATION</Text>
              <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
            </View>
          )}
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have admin access? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('AdminLogin')}>
            <Text style={styles.footerLink}>Login here</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 56,
    paddingBottom: 40,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#111827',
    letterSpacing: -0.3,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  noticeCard: {
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 8,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 24,
  },
  noticeText: {
    fontSize: 13,
    color: '#92400E',
    flex: 1,
    lineHeight: 18,
  },
  fieldGroup: {
    marginBottom: 18,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#374151',
    letterSpacing: 1.2,
    marginBottom: 8,
  },
  required: {
    color: '#1A1A1A',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 6,
    paddingHorizontal: 14,
    height: 48,
    backgroundColor: '#FFFFFF',
    gap: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#111827',
  },
  requirementsCard: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
  },
  requirementsTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: '#374151',
    letterSpacing: 1.2,
    marginBottom: 10,
  },
  requirementItem: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 4,
    paddingLeft: 8,
  },
  submitButton: {
    backgroundColor: '#1A1A1A',
    borderRadius: 6,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  submitDisabled: {
    backgroundColor: '#9CA3AF',
  },
  submitContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  submitText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 1.5,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  footerText: {
    fontSize: 13,
    color: '#6B7280',
  },
  footerLink: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1A1A1A',
    textDecorationLine: 'underline',
  },
});

export default AdminSignupScreen;
