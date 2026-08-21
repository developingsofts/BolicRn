import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  Modal,
  Platform,
  ToastAndroid,
  RefreshControl,
  KeyboardAvoidingView,
  Image,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";
import BasicTopBar from "../components/BasicTopBar";
import { COLORS, DIMENSIONS } from "../config/constants";
import { REFRESH_INDICATOR_PROPS } from "../components/RefreshableScrollView";
import { Ionicons } from "@expo/vector-icons";
import ConfirmDialog from "../components/ConfirmDialog";
import TrainerSetupStep1 from "../components/TrainerSetupStep1";
import {
  useGetTrainingPricesQuery,
  useDeleteTrainingPricesMutation,
  useCreateTrainingPriceMutation,
  useUpdateTrainingPriceMutation,
} from "../services/api/pricesApi";
import { useAuth } from "../contexts/AuthContext";
import { TextInput } from "react-native-gesture-handler";
import FontWeight from "../hooks/useInterFonts";
import { Add } from "../../assets";
import { useAndroidNavBar } from "../hooks/useAndroidNavBar";

interface Package {
  id: string;
  title: string;
  description: string;
  price: number;
}

const TrainerPricing: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { user } = useAuth();
  const { height: navBarHeight } = useAndroidNavBar();

  const trainerId = user?.id || "";
  const [packages, setPackages] = useState<Package[]>([]);
  const {
    data: pricesData,
    refetch: refetchPrices,
    isLoading: loading,
  } = useGetTrainingPricesQuery({ trainerId }, { skip: !trainerId });
  const [deletePrices] = useDeleteTrainingPricesMutation();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const sessions =
    pricesData && pricesData.status && "data" in pricesData
      ? pricesData.data
      : [];

  const [modalVisible, setModalVisible] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [editingSession, setEditingSession] = useState<any>(null);
  const [createTrainingPrice] = useCreateTrainingPriceMutation();
  const [updateTrainingPrice] = useUpdateTrainingPriceMutation();

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = async () => {
    setRefreshing(true);
    refetchPrices();
    setRefreshing(false);
  };

  useEffect(() => {
    const mapped = sessions.map((s: any) => ({
      id: s.id || s._id,
      title: s.session_name || s.title || "",
      description: s.description || "",
      price: s.price || 0,
    }));
    setPackages(mapped);
  }, [pricesData]);

  const handleDeleteConfirm = async () => {
    if (deleteId) {
      try {
        await deletePrices({ ids: [deleteId] }).unwrap();
        setPackages(packages.filter((pkg) => pkg.id !== deleteId));
      } catch (e) {
        Alert.alert("Failed to delete session");
      }
    }
    setShowDeleteDialog(false);
    setDeleteId(null);
  };

  const openAddSession = () => {
    setModalMode("create");
    setEditingSession(null);
    setModalVisible(true);
  };

  const openEditSession = (session: any) => {
    setModalMode("edit");
    setEditingSession(session);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setEditingSession(null);
  };

  const [modalForm, setModalForm] = useState<any>({
    session_name: "",
    description: "",
    price: "",
  });

  useEffect(() => {
    if (modalVisible) {
      if (modalMode === "edit" && editingSession) {
        setModalForm({
          session_name:
            editingSession.session_name || editingSession.title || "",
          description: editingSession.description || "",
          price: editingSession.price ? String(editingSession.price) : "",
        });
      } else {
        setModalForm({ session_name: "", description: "", price: "" });
      }
    }
  }, [modalVisible, modalMode, editingSession]);

  const handleModalSubmit = async () => {
    try {
      if (modalMode === "create") {
        await createTrainingPrice([
          {
            session_name: modalForm.session_name,
            description: modalForm.description,
            price: modalForm.price,
          },
        ]).unwrap();
      } else if (modalMode === "edit" && editingSession) {
        await updateTrainingPrice({
          id: editingSession.id,
          session_name: modalForm.session_name,
          description: modalForm.description,
          price: modalForm.price,
        }).unwrap();
      }
      closeModal();
    } catch (e: any) {
      Alert.alert("Error", e?.data?.message || "Failed to save session");
    }
  };
  return (
    <SafeAreaView edges={[]} style={styles.container}>
      <BasicTopBar
        onBackPress={() => navigation.goBack()}
        title="Pricing & Packages"
        subtitle="View and manage your pricing and packages"
        containerStyle={{
          paddingTop: DIMENSIONS.spacing.xxl,
          paddingBottom: DIMENSIONS.spacing.lg,
        }}
      />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            {...REFRESH_INDICATOR_PROPS}
          />
        }
      >
        <View style={styles.packagesList}>
          {loading ? (
            <Text style={{ textAlign: "center", marginVertical: 24, color: COLORS.textSecondary }}>
              Loading...
            </Text>
          ) : packages.length === 0 ? (
            <Text style={{ textAlign: "center", marginVertical: 24, color: COLORS.textSecondary }}>
              No sessions found.
            </Text>
          ) : (
            <>
              {packages.map((pkg) => (
                <View key={pkg.id} style={styles.card}>
                  <View style={styles.cardContent}>
                    <View style={styles.cardHeader}>
                      <View style={styles.cardInfo}>
                        <Text style={styles.cardTitle}>{pkg.title}</Text>
                        <Text style={styles.cardDesc}>{pkg.description}</Text>
                      </View>
                      <View style={styles.cardPriceBox}>
                        <Text style={styles.cardPrice}>
                          ${pkg.price}
                          <Text style={styles.cardPerHour}>/hour</Text>
                        </Text>
                      </View>
                    </View>
                    <View style={styles.cardActions}>
                      <TouchableOpacity
                        style={[styles.actionBtn, styles.deleteBtn]}
                        onPress={() => {
                          setDeleteId(pkg.id);
                          setShowDeleteDialog(true);
                        }}
                      >
                        <Text style={styles.deleteText}>Delete</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.actionBtn, styles.editBtn]}
                        onPress={() => openEditSession(pkg)}
                      >
                        <Text style={styles.editText}>Edit</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              ))}
            </>
          )}
          <TouchableOpacity style={styles.addBtn} onPress={openAddSession}>
            <Text style={styles.addBtnText}>Add New Session</Text>
            <Image
              source={Add}
              style={{
                width: 10,
                height: 10,
                marginLeft: 8,
                tintColor: COLORS._191919,
              }}
            />
          </TouchableOpacity>
        </View>
      </ScrollView>
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={closeModal}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
          <View
            style={{
              backgroundColor: "rgba(0,0,0,0.3)",
              flex: 1,
              justifyContent: "flex-end",
            }}
          >
            <View
              style={{
                backgroundColor: COLORS.surface,
                paddingTop: 16,
                paddingHorizontal: 20,
                paddingBottom: 32 + navBarHeight,
                borderTopLeftRadius: 24,
                borderTopRightRadius: 24,
                width: "100%",
                shadowColor: "#000",
                shadowOffset: { width: 0, height: -2 },
                shadowOpacity: 0.15,
                shadowRadius: 12,
                elevation: 10,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 12,
                  position: "relative",
                }}
              >
                <Text
                  style={{
                    fontFamily: FontWeight.SemiBold,
                    fontSize: 20,
                    textAlign: "center",
                    flex: 1,
                    color: COLORS.text,
                  }}
                >
                  {modalMode === "edit" ? "Edit Session" : "Create Session"}
                </Text>
                <TouchableOpacity
                  onPress={closeModal}
                  style={{ position: "absolute", right: 0, padding: 4 }}
                >
                  <Ionicons name="close" size={24} color={COLORS.text} />
                </TouchableOpacity>
              </View>
              <View style={styles.sessionCard}>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Session name</Text>
                  <TextInput
                    style={[styles.inputField, { height: 48 }]}
                    value={modalForm.session_name}
                    onChangeText={(text) =>
                      setModalForm((f: any) => ({ ...f, session_name: text }))
                    }
                    placeholder="Session name"
                    placeholderTextColor={COLORS._5E5E5E}
                  />
                </View>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Description</Text>
                  <TextInput
                    style={[styles.inputField, { height: 48 }]}
                    value={modalForm.description}
                    onChangeText={(text) =>
                      setModalForm((f: any) => ({ ...f, description: text }))
                    }
                    placeholder="Description"
                    placeholderTextColor={COLORS._5E5E5E}
                    multiline
                  />
                </View>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Price per hour</Text>
                  <TextInput
                    style={[styles.inputField, { height: 48 }]}
                    value={modalForm.price}
                    onChangeText={(text) =>
                      setModalForm((f: any) => ({ ...f, price: text }))
                    }
                    placeholder="$ per hour"
                    placeholderTextColor={COLORS._5E5E5E}
                    keyboardType="numeric"
                  />
                </View>
              </View>
              <TouchableOpacity
                style={{
                  backgroundColor: COLORS.primary,
                  borderRadius: 8,
                  padding: 14,
                  alignItems: "center",
                  marginTop: 18,
                }}
                onPress={handleModalSubmit}
              >
                <Text
                  style={{ color: COLORS.black, fontFamily: FontWeight.Medium, fontSize: 14 }}
                >
                  {modalMode === "edit" ? "Update" : "Create"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
      <ConfirmDialog
        visible={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Session"
        description={`Once session is deleted, your upcoming applications for the session will be cancelled and users will be notified.`}
        confirmText="Delete"
        cancelText="Cancel"
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    padding: 24,
  },
  packagesList: {
    width: "100%",
    maxWidth: 500,
    alignSelf: "center",
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  cardContent: {
    padding: 18,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  cardInfo: {
    flex: 1,
    marginRight: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontFamily: FontWeight.SemiBold,
    color: COLORS.text,
    marginBottom: 4,
  },
  cardDesc: {
    fontSize: 14,
    color: COLORS._5E5E5E,
    fontFamily: FontWeight.Regular,
  },
  cardPriceBox: {
    flexDirection: "row",
    alignItems: "flex-end",
    minWidth: 80,
  },
  cardPrice: {
    fontSize: 20,
    fontFamily: FontWeight.SemiBold,
    color: COLORS.primary,
  },
  cardPerHour: {
    fontSize: 14,
    fontFamily: FontWeight.SemiBold,
    color: COLORS.primary,
    marginTop: 0,
  },
  cardActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
  actionBtn: {
    flex: 1,
    borderRadius: 5,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  deleteBtn: {
    backgroundColor: COLORS.surface,
    boxShadow: "0px 0px 12px 0px #76767626",
  },
  editBtn: {
    backgroundColor: COLORS.primary,
  },
  deleteText: {
    color: COLORS._EB3434,
    fontFamily: FontWeight.Medium,
    fontSize: 14,
  },
  editText: {
    color: COLORS.black,
    fontFamily: FontWeight.Medium,
    fontSize: 14,
  },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
    backgroundColor: COLORS.surface,
    paddingVertical: 14,
    marginTop: 8,
  },
  addBtnText: {
    color: COLORS._383838,
    fontFamily: FontWeight.Medium,
    fontSize: 14,
  },
  label: {
    fontSize: 12,
    fontFamily: FontWeight.Medium,
    color: COLORS.text,
    marginBottom: 2,
  },
  sessionCard: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: 20,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  sessionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sessionTitle: {
    fontSize: 16,
    fontFamily: FontWeight.SemiBold,
    color: COLORS.text,
  },
  inputGroup: {
    marginBottom: 12,
  },
  inputField: {
    backgroundColor: COLORS.background,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    minHeight: 36,
    justifyContent: "center",
    fontSize: 14,
    color: COLORS.app_black,
    fontFamily: FontWeight.Regular,
  },
});

export default TrainerPricing;
