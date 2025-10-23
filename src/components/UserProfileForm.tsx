import React, { useState, useImperativeHandle, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { Button, ProgressBar } from "react-native-paper";
import { COLORS, LOCATION_CONFIG } from "../config/constants";
import { useGetTrainingTypesQuery } from "../services/api/userApi";

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
  const [location, setLocation] = useState(initialLocation);
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>(initialSpecialties);
  const [isLocationFocused, setIsLocationFocused] = useState(false);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [errors, setErrors] = useState<{
    location?: string;
    specialties?: string;
  }>({});
  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = 12; // Show 12 items per page (3 rows of 4)

  // Expose submit function via ref
  useImperativeHandle(ref, () => ({
    submit: onSubmit,
  }));

  // Fetch training types from API
  const { data: trainingTypesData, isLoading: isLoadingTrainingTypes } = useGetTrainingTypesQuery();
  const trainingTypes = (trainingTypesData as any)?.data || [];

  const totalPages = Math.ceil(trainingTypes.length / itemsPerPage);
  const paginatedTypes = trainingTypes.slice(
    currentPage * itemsPerPage,
    (currentPage + 1) * itemsPerPage
  );

  // Location suggestions - using a simple list for now
  const fetchSuggestions = useCallback(async (query: string) => {
    const trimmed = query.trim().toLowerCase();

    if (!trimmed || trimmed.length < 2) {
      setSuggestions([]);
      return;
    }

    try {
      // Simple location suggestions - can be expanded with more cities
      const commonLocations = [
        "New York, NY",
        "Los Angeles, CA",
        "Chicago, IL",
        "Houston, TX",
        "Phoenix, AZ",
        "Philadelphia, PA",
        "San Antonio, TX",
        "San Diego, CA",
        "Dallas, TX",
        "San Jose, CA",
        "Austin, TX",
        "Jacksonville, FL",
        "Fort Worth, TX",
        "Columbus, OH",
        "Charlotte, NC",
        "San Francisco, CA",
        "Indianapolis, IN",
        "Seattle, WA",
        "Denver, CO",
        "Boston, MA",
        "El Paso, TX",
        "Nashville, TN",
        "Detroit, MI",
        "Oklahoma City, OK",
        "Portland, OR",
        "Las Vegas, NV",
        "Memphis, TN",
        "Louisville, KY",
        "Baltimore, MD",
        "Milwaukee, WI",
        "Albuquerque, NM",
        "Tucson, AZ",
        "Fresno, CA",
        "Sacramento, CA",
        "Mesa, AZ",
        "Kansas City, MO",
        "Atlanta, GA",
        "Long Beach, CA",
        "Colorado Springs, CO",
        "Raleigh, NC",
        "Miami, FL",
        "Virginia Beach, VA",
        "Omaha, NE",
        "Oakland, CA",
        "Minneapolis, MN",
        "Tulsa, OK",
        "Arlington, TX",
        "Tampa, FL",
        "New Orleans, LA",
        "Wichita, KS"
      ];

      const filteredLocations = commonLocations
        .filter(location => location.toLowerCase().includes(trimmed))
        .slice(0, 5)
        .map(location => ({
          text: location,
          magicKey: location,
          isCollection: false
        }));

      setSuggestions(filteredLocations);
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
    console.log("🔍 UserProfileForm onSubmit called");
    console.log("Location:", location);
    console.log("Selected specialties:", selectedSpecialties);
    
    if (validate()) {
      console.log("✅ Validation passed, calling onNext");
      if (onNext) {
        onNext({ location, specialties: selectedSpecialties });
      } else {
        console.log("❌ onNext is not defined");
      }
    } else {
      console.log("❌ Validation failed");
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
              >
                {paginatedTypes.map((trainingType: any) => {
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
                })}
              </ScrollView>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <View style={styles.paginationContainer}>
                  <TouchableOpacity
                    style={[styles.paginationButton, currentPage === 0 && styles.paginationButtonDisabled]}
                    onPress={() => setCurrentPage(Math.max(0, currentPage - 1))}
                    disabled={currentPage === 0}
                  >
                    <Text style={[styles.paginationText, currentPage === 0 && styles.paginationTextDisabled]}>‹</Text>
                  </TouchableOpacity>

                  <Text style={styles.pageIndicator}>
                    {currentPage + 1} of {totalPages}
                  </Text>

                  <TouchableOpacity
                    style={[styles.paginationButton, currentPage === totalPages - 1 && styles.paginationButtonDisabled]}
                    onPress={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
                    disabled={currentPage === totalPages - 1}
                  >
                    <Text style={[styles.paginationText, currentPage === totalPages - 1 && styles.paginationTextDisabled]}>›</Text>
                  </TouchableOpacity>
                </View>
              )}
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
    height: 200, // Fixed height for scrolling
  },
  specialtiesScrollView: {
    flex: 1,
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
});

export default UserProfileForm;
