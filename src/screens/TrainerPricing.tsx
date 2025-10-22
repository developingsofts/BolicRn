import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import BasicTopBar from '../components/BasicTopBar';
import { COLORS, DIMENSIONS } from '../config/constants';
import { Ionicons } from '@expo/vector-icons';
import ConfirmDialog from '../components/ConfirmDialog';

interface Package {
  id: string;
  title: string;
  description: string;
  price: number;
}

const initialPackages: Package[] = [
  {
    id: '1',
    title: 'Single Session',
    description: 'One-on-one personalized training session.',
    price: 75,
  },
  {
    id: '2',
    title: '5 - Session Pack',
    description: 'Save 10% with a bundle of 5 sessions.',
    price: 67.5,
  },
  {
    id: '3',
    title: '10 - Session Pack',
    description: 'Best value! Save 20% with 10 sessions.',
    price: 60,
  },
];

const TrainerPricing: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [packages, setPackages] = useState<Package[]>(initialPackages);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleDelete = (id: string) => {
    setDeleteId(id);
    setShowDeleteDialog(true);
  };

  const handleDeleteConfirm = () => {
    if (deleteId) {
      setPackages(packages.filter((pkg) => pkg.id !== deleteId));
    }
    setShowDeleteDialog(false);
    setDeleteId(null);
    // Optionally show a toast or alert here
    // Alert.alert('Package deleted successfully!');
  };

  const handleEdit = (id: string) => {
    Alert.alert(`Editing package ${id}`);
  };

  const handleAddNew = () => {
    Alert.alert('Add new session functionality coming soon!');
  };

  return (
    <SafeAreaView edges={[]} style={styles.container}>
      <BasicTopBar
        onBackPress={() => navigation.goBack()}
        title="Pricing & Packages"
        subtitle="View and manage your pricing and packages"
        containerStyle={{ paddingTop: DIMENSIONS.spacing.xxl, paddingBottom: DIMENSIONS.spacing.lg }}
      />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.packagesList}>
          {packages.map((pkg) => (
            <View key={pkg.id} style={styles.card}>
              <View style={styles.cardContent}>
                <View style={styles.cardHeader}>
                  <View style={styles.cardInfo}>
                    <Text style={styles.cardTitle}>{pkg.title}</Text>
                    <Text style={styles.cardDesc}>{pkg.description}</Text>
                  </View>
                  <View style={styles.cardPriceBox}>
                    <Text style={styles.cardPrice}>${pkg.price}</Text>
                    <Text style={styles.cardPerHour}>/hour</Text>
                  </View>
                </View>
                <View style={styles.cardActions}>
                  <TouchableOpacity style={[styles.actionBtn, styles.deleteBtn]} onPress={() => handleDelete(pkg.id)}>
                    <Text style={styles.deleteText}>Delete</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.actionBtn, styles.editBtn]} onPress={() => handleEdit(pkg.id)}>
                    <Text style={styles.editText}>Edit</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))}
          <TouchableOpacity style={styles.addBtn} onPress={handleAddNew}>
            <Text style={styles.addBtnText}>Add New Session</Text>
            <Ionicons name="add" size={22} color={COLORS.primary} style={{ marginLeft: 8 }} />
          </TouchableOpacity>
        </View>
      </ScrollView>
      <ConfirmDialog
        visible={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Session"
        description={
          `Once session is deleted, your upcoming applications for the session will be cancelled and users will be notified.`
        }
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
    width: '100%',
    maxWidth: 500,
    alignSelf: 'center',
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    marginBottom: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  cardContent: {
    padding: 18,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  cardInfo: {
    flex: 1,
    marginRight: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  cardDesc: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  cardPriceBox: {
    alignItems: 'flex-end',
    minWidth: 80,
  },
  cardPrice: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  cardPerHour: {
    fontSize: 13,
    color: COLORS.primary,
    marginTop: 2,
  },
  cardActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  actionBtn: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteBtn: {
    backgroundColor: '#E6E6E6',
  },
  editBtn: {
    backgroundColor: COLORS.primary,
  },
  deleteText: {
    color: '#DA9393',
    fontWeight: '600',
    fontSize: 16,
  },
  editText: {
    color: COLORS.white,
    fontWeight: '600',
    fontSize: 16,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.primary,
    paddingVertical: 18,
    marginTop: 8,
  },
  addBtnText: {
    color: COLORS.primary,
    fontWeight: '600',
    fontSize: 16,
  },
});

export default TrainerPricing;
