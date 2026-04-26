import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Platform
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { makeApiCall, apiClient } from '../../config/supabase';

const WeatherWidget = () => {
  const [weatherData, setWeatherData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchWeather();
  }, []);

  const fetchWeather = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await makeApiCall(`${apiClient.baseUrl}/api/weather`, {
        method: 'GET'
      });

      if (response && response.success && response.data) {
        setWeatherData(response.data);
      } else {
        setError('Weather data unavailable');
      }
    } catch (err) {
      console.error('Failed to fetch weather:', err);
      setError('Connection failed');
    } finally {
      setLoading(false);
    }
  };

  const getWeatherIcon = (weatherCode, isDay = 1) => {
    // Open-Meteo WMO codes mapping to Ionicons
    if (weatherCode === 0) return isDay ? 'sunny' : 'moon';
    if (weatherCode >= 1 && weatherCode <= 3) return isDay ? 'partly-sunny' : 'cloudy-night';
    if (weatherCode >= 45 && weatherCode <= 48) return 'cloud'; // Fog
    if (weatherCode >= 51 && weatherCode <= 57) return 'rainy-outline'; // Drizzle
    if (weatherCode >= 61 && weatherCode <= 67) return 'rainy'; // Rain
    if (weatherCode >= 71 && weatherCode <= 77) return 'snow'; // Snow
    if (weatherCode >= 80 && weatherCode <= 82) return 'water'; // Showers
    if (weatherCode >= 95 && weatherCode <= 99) return 'thunderstorm'; // Thunderstorm
    return 'partly-sunny'; // Default
  };

  const getBackgroundColors = (weatherCode) => {
    // Blue for rain/water, gray for fog, orange/blue for clear
    if (weatherCode >= 51 && weatherCode <= 67) return ['#3b82f6', '#1e40af']; // Rain
    if (weatherCode >= 80 && weatherCode <= 82) return ['#2563eb', '#1e3a8a']; // Showers
    if (weatherCode >= 95 && weatherCode <= 99) return ['#1e3a8a', '#0f172a']; // Thunderstorm
    if (weatherCode >= 71 && weatherCode <= 77) return ['#93c5fd', '#3b82f6']; // Snow
    if (weatherCode >= 45 && weatherCode <= 48) return ['#94a3b8', '#475569']; // Fog
    if (weatherCode >= 1 && weatherCode <= 3) return ['#38bdf8', '#0284c7']; // Cloudy
    return ['#38bdf8', '#0ea5e9']; // Clear sky
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color="#1A1A1A" />
        <Text style={styles.loadingText}>Loading live weather...</Text>
      </View>
    );
  }

  if (error || !weatherData) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="cloud-offline" size={24} color="#999" />
        <Text style={styles.errorText}>{error || 'Weather not available'}</Text>
      </View>
    );
  }

  const { current, forecast, isHeavyRainExpected, alertMessage, location } = weatherData;
  const bgColors = getBackgroundColors(current.weatherCode);

  return (
    <View style={styles.container}>
      {/* Smart Contextual Warning Banner */}
      {isHeavyRainExpected && alertMessage && (
        <View style={styles.alertBanner}>
          <Ionicons name="warning" size={20} color="#fff" />
          <Text style={styles.alertText}>{alertMessage}</Text>
        </View>
      )}

      {/* Main Weather Card */}
      <LinearGradient colors={bgColors} style={styles.weatherCard}>
        <View style={styles.currentWeatherTop}>
          <View style={styles.currentWeatherLeft}>
            <View style={styles.locationRow}>
              <Ionicons name="location" size={13} color="#fff" />
              <Text style={styles.locationText}>{location}</Text>
            </View>
            <Text style={styles.tempText}>{Math.round(current.temp)}°C</Text>
            <Text style={styles.conditionText}>{current.condition}</Text>
          </View>
          
          <View style={styles.iconContainer}>
            <Ionicons name={getWeatherIcon(current.weatherCode, current.isDay)} size={52} color="rgba(255,255,255,0.85)" />
          </View>
        </View>

        <View style={styles.currentDetailsRow}>
          <View style={styles.detailItem}>
            <MaterialCommunityIcons name="thermometer-lines" size={14} color="rgba(255,255,255,0.8)" />
            <Text style={styles.detailText}>Feels {Math.round(current.feelsLike)}°</Text>
          </View>
          <View style={styles.detailItem}>
            <Ionicons name="water-outline" size={14} color="rgba(255,255,255,0.8)" />
            <Text style={styles.detailText}>{current.humidity}%</Text>
          </View>
          <View style={styles.detailItem}>
            <Ionicons name="speedometer-outline" size={14} color="rgba(255,255,255,0.8)" />
            <Text style={styles.detailText}>{Math.round(current.windSpeed)} km/h</Text>
          </View>
        </View>

        {/* 7-Day Forecast */}
        <View style={styles.forecastContainer}>
          <Text style={styles.forecastTitle}>7-Day Forecast</Text>
          <View style={styles.forecastRow}>
            {forecast && forecast.slice(0, 7).map((day, index) => {
              const dateObj = new Date(day.date);
              const dayName = index === 0 ? 'Today' : index === 1 ? 'Tom' : dateObj.toLocaleDateString('en-US', { weekday: 'short' });
              
              return (
                <View key={index} style={styles.forecastItem}>
                  <Text style={styles.forecastDay}>{dayName}</Text>
                  <Ionicons name={getWeatherIcon(day.weatherCode, 1)} size={18} color="#fff" style={{ marginVertical: 3 }} />
                  <Text style={styles.forecastTemp}>{Math.round(day.minTemp)}° / {Math.round(day.maxTemp)}°</Text>
                </View>
              );
            })}
          </View>
        </View>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 4,
    marginBottom: 12,
    marginTop: 6,
  },
  loadingContainer: {
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8f9fa',
    marginHorizontal: 4,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#eee',
    marginBottom: 12,
  },
  loadingText: {
    marginTop: 8,
    color: '#666',
    fontSize: 13,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginHorizontal: 4,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#eee',
  },
  errorText: {
    color: '#999',
    marginLeft: 8,
    fontSize: 13,
  },
  alertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ef4444',
    padding: 10,
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
    marginBottom: -6,
    paddingBottom: 16,
    zIndex: 0,
  },
  alertText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 8,
    fontSize: 12,
    flex: 1,
  },
  weatherCard: {
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    zIndex: 1,
  },
  currentWeatherTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  currentWeatherLeft: {
    flex: 1,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  locationText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  tempText: {
    color: '#fff',
    fontSize: 36,
    fontWeight: 'bold',
    includeFontPadding: false,
  },
  conditionText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 14,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  currentDetailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.15)',
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  detailText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '500',
    marginLeft: 4,
  },
  forecastContainer: {
    marginTop: 12,
  },
  forecastTitle: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
  },
  forecastRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  forecastItem: {
    flex: 1,
    alignItems: 'center',
  },
  forecastDay: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 11,
    fontWeight: '500',
  },
  forecastTemp: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
});

export default WeatherWidget;
