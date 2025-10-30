import React, { useState, useImperativeHandle, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { Button, ProgressBar } from "react-native-paper";
import { COLORS, LOCATION_CONFIG, TRAINING_TYPES } from "../config/constants";
import { useGetTrainingTypesQuery } from "../services/api/userApi";
import { useAuth } from '../contexts/AuthContext';

interface UserProfileFormProps {
  onNext?: (data: { location: string; specialties: string[] }) => void;
  onBack?: () => void;
  initialLocation?: string;
  initialSpecialties?: string[];
}

const UserProfileForm = React.forwardRef<
  {
    submit: () => void;
  },
  UserProfileFormProps
>(({ onNext, onBack, initialLocation = "", initialSpecialties = [] }, ref) => {
  const { isAuthenticated } = useAuth();
  const [location, setLocation] = useState(initialLocation);
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>(initialSpecialties);
  const [isLocationFocused, setIsLocationFocused] = useState(false);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [errors, setErrors] = useState<{
    location?: string;
    specialties?: string;
  }>({});

  const [visibleCount, setVisibleCount] = useState(12);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Expose submit function via ref
  useImperativeHandle(ref, () => ({
    submit: onSubmit,
  }));

  // Fetch training types from API
  const { data: trainingTypesData, isLoading: isLoadingTrainingTypes } = useGetTrainingTypesQuery(undefined, { skip: !isAuthenticated });
  const apiTrainingTypes = (trainingTypesData as any)?.data || [];
  const trainingTypes = apiTrainingTypes.length > 0 ? apiTrainingTypes : TRAINING_TYPES.map(title => ({ id: title, title }));

  const visibleTypes = trainingTypes.slice(0, visibleCount);

  const handleScroll = (event: any) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const isCloseToBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - 50;
    if (isCloseToBottom) {
      loadMore();
    }
  };

  const loadMore = () => {
    if (isLoadingMore || visibleCount >= trainingTypes.length) return;
    setIsLoadingMore(true);
    // Simulate loading delay
    setTimeout(() => {
      setVisibleCount(prev => Math.min(prev + 12, trainingTypes.length));
      setIsLoadingMore(false);
    }, 500);
  };

  // Location suggestions - using API
  const fetchSuggestions = useCallback(async (query: string) => {
    const trimmed = query.trim();

    if (!trimmed || trimmed.length < 2) {
      setSuggestions([]);
      return;
    }

    try {
      const response = await fetch(
        `${LOCATION_CONFIG.geocodeSuggestUrl}?text=${encodeURIComponent(
          trimmed
        )}&f=json`
      );
      const data = await response.json();

      if (data?.suggestions) {
        setSuggestions(data.suggestions);
      } else {
        setSuggestions([]);
      }
    } catch (error) {
      console.error("Error fetching suggestions:", error);
      setSuggestions([]);
    }
  }, []);

  const handleSelectSuggestion = (text: string) => {
    setLocation(text);
    setSuggestions([]);
    setIsLocationFocused(false);
  };

  const toggleSpecialty = (specialty: string) => {
    setSelectedSpecialties((prev) =>
      prev.includes(specialty)
        ? prev.filter((s) => s !== specialty)
        : [...prev, specialty]
    );
  };

  const validate = () => {
    const newErrors: typeof errors = {};
    if (!location.trim()) newErrors.location = "Location is required";
    else if (location.length > 200)
      newErrors.location = "Location must be less than 200 characters";
    if (selectedSpecialties.length === 0)
      newErrors.specialties = "Please select at least one specialty";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const onSubmit = () => {
    if (validate()) {
      if (onNext) {
        onNext({ location, specialties: selectedSpecialties });
      }
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.form}>
        {/* Location Field */}
        <View style={styles.formItem}>
          <Text style={styles.label}>Your location</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={[styles.input, errors.location && styles.inputError]}
              placeholder="e.g. San Francisco, CA"
              value={location}
              onChangeText={(text) => {
                setLocation(text);
                fetchSuggestions(text);
              }}
              onFocus={() => setIsLocationFocused(true)}
              onBlur={() => {
                // Delay hiding suggestions to allow selection
                setTimeout(() => setIsLocationFocused(false), 200);
              }}
              autoCapitalize="words"
            />
            {isLocationFocused && suggestions.length > 0 && (
              <ScrollView style={styles.suggestionsContainer} keyboardShouldPersistTaps="handled">
                {suggestions.map((item) => (
                  <TouchableOpacity
                    key={item.magicKey}
                    style={styles.suggestionItem}
                    onPress={() => handleSelectSuggestion(item.text)}
                  >
                    <Text style={styles.suggestionText}>{item.text}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>
          {errors.location && (
            <Text style={styles.error}>{errors.location}</Text>
          )}
        </View>

        {/* Specialty Selection */}
        <View style={styles.formItem}>
          <Text style={styles.label}>Your Specialty (select at least one)</Text>
          {isLoadingTrainingTypes ? (
            <Text style={styles.loadingText}>Loading training types...</Text>
          ) : (
            <View style={styles.specialtiesContainer}>
  
                <ScrollView
                  style={styles.specialtiesScrollView}
                  contentContainerStyle={styles.badgeContainer}
                  showsVerticalScrollIndicator={true}
                  onScroll={handleScroll}
                  scrollEventThrottle={16}
                >
                  {visibleTypes.length === 0 ? (
                    <Text style={styles.loadingText}>No training types available</Text>
                  ) : (
                    visibleTypes.map((trainingType: any) => {
                      const selected = selectedSpecialties.includes(trainingType.title);
                      return (
                        <TouchableOpacity
                          key={trainingType.id}
                          style={[
                            styles.badge,
                            selected ? styles.badgeSelected : styles.badgeUnselected,
                          ]}
                          onPress={() => toggleSpecialty(trainingType.title)}
                          activeOpacity={0.8}
                        >
                          <Text
                            style={[
                              styles.badgeText,
                              selected && styles.badgeTextSelected,
                            ]}
                          >
                            {trainingType.title}
                          </Text>
                        </TouchableOpacity>
                      );
                    })
                  )}
                  {isLoadingMore && (
                    <View style={styles.loadingMoreContainer}>
                      <ActivityIndicator size="small" color={COLORS.primary} />
                      <Text style={styles.loadingMoreText}>Loading more...</Text>
                    </View>
                  )}
                  {isLoadingMore && (
                    <View style={styles.loadingMoreContainer}>
                      <ActivityIndicator size="small" color={COLORS.primary} />
                      <Text style={styles.loadingMoreText}>Loading more...</Text>
                    </View>
                  )}
                </ScrollView>
          
            </View>
          )}
          {errors.specialties && (
            <Text style={styles.error}>{errors.specialties}</Text>
          )}
        </View>
      </View>
    </View>
  );
});

UserProfileForm.displayName = "UserProfileForm";

const styles = StyleSheet.create({
  container: {
    width: "100%",
    alignSelf: "center",
    padding: 20,
    flexGrow: 1,
    borderRadius: 16,
    backgroundColor: COLORS.white,
    justifyContent: "center",
  },
  header: { marginBottom: 16 },
  title: { fontSize: 24, fontWeight: "600", color: "#222" },
  step: { fontSize: 14, color: "#888", marginTop: 4 },
  progress: { height: 8, borderRadius: 4, marginBottom: 24 },
  form: { gap: 16 },
  formItem: { marginBottom: 12 },
  label: { fontSize: 15, fontWeight: "500", color: "#222", marginBottom: 6 },
  input: {
    backgroundColor: "#f3f4f6",
    borderColor: "#e5e7eb",
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
  },
  inputContainer: {
    position: 'relative',
  },
  inputError: {
    borderColor: "#ef4444",
  },
  error: {
    color: "#ef4444",
    fontSize: 13,
    marginTop: 2,
  },
  badgeContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 8,
  },
  badge: {
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  badgeUnselected: {
    backgroundColor: "#F2F2F7",
  },
  badgeSelected: {
    backgroundColor: "#6366F1",
  },
  badgeTextSelected: {
    fontSize: 14,
    color: COLORS.white,  
  },
  badgeText: {
    fontSize: 14,
    color: COLORS?._5E5E5E,
  },
  loadingText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 8,
  },
  suggestionsContainer: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: COLORS.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    maxHeight: 200,
    zIndex: 1000,
    elevation: 5,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  suggestionItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  suggestionText: {
    fontSize: 14,
    color: COLORS.text,
  },
  specialtiesContainer: {
    maxHeight: 250,
    minHeight: 250,
  },
  specialtiesScrollView: {
    maxHeight: 250,
    minHeight: 250,
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  paginationButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 8,
  },
  paginationButtonDisabled: {
    backgroundColor: COLORS.border,
  },
  paginationText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  paginationTextDisabled: {
    color: COLORS.textSecondary,
  },
  pageIndicator: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginHorizontal: 16,
  },
  loadingMoreContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    width: '100%',
  },
  loadingMoreText: {
    marginTop: 8,
    fontSize: 14,
    color: COLORS.textSecondary,
  },
});

export default UserProfileForm;
