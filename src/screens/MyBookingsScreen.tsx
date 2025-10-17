import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import BasicTopBar from '../components/BasicTopBar';
import MyBookingCard from '../components/MyBookingCard';
import { COLORS, DIMENSIONS } from '../config/constants';
import FontWeight from '../hooks/useInterFonts';

const mockBookings = [
	{
		id: '1',
		sessionType: '5 - Session',
		date: 'Oct 10 - Oct 15, 2025',
		timeRange: '9:00 AM - 10:00 AM',
		clientName: 'Taylor',
		clientInitial: 'T',
	},
	{
		id: '2',
		sessionType: 'Single Session',
		date: 'Tuesday - Oct 26, 2025',
		timeRange: '10:30 AM - 11:30 AM',
		clientName: 'Alex',
		clientInitial: 'A',
	},
	{
		id: '3',
		sessionType: 'Single Session',
		date: 'Wednesday - Oct 27, 2025',
		timeRange: '1:00 PM - 3:00 PM',
		clientName: 'Jordan',
		clientInitial: 'J',
	},
];

const TABS = [
	{ key: 'upcoming', label: 'Upcoming' },
	{ key: 'completed', label: 'Completed' },
	{ key: 'canceled', label: 'Canceled' },
];

const MyBookingsScreen = ({ navigation }: any) => {
	const [activeTab, setActiveTab] = useState('upcoming');

	const handleDecline = (clientName: string) => {
		alert(`You've declined the booking with ${clientName}`);
	};

	const handleReschedule = (clientName: string) => {
		alert(`Booking with ${clientName} has been rescheduled`);
	};

	return (
		<SafeAreaView edges={[]} style={styles.container}>
			<BasicTopBar
				onBackPress={() => navigation.goBack?.()}
				title="My Bookings"
				subtitle="View and manage your bookings"
				containerStyle={{ paddingTop: DIMENSIONS.spacing.xxl, paddingBottom: DIMENSIONS.spacing.lg }}
			/>
			<View style={styles.tabContainerWrapper}>
				<View style={styles.tabContainer}>
					{TABS.map((tab) => (
						<TouchableOpacity
							key={tab.key}
							style={[styles.tabButton, activeTab === tab.key && styles.tabButtonActive]}
							onPress={() => setActiveTab(tab.key)}
						>
							<Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>{tab.label}</Text>
						</TouchableOpacity>
					))}
				</View>
			</View>
			<ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
				{activeTab === 'upcoming' && (
					<View style={styles.bookingList}>
						{mockBookings.map((booking) => (
							<MyBookingCard
								key={booking.id}
								{...booking}
								onDecline={handleDecline}
								onReschedule={handleReschedule}
								navigation={navigation}
							/>
						))}
					</View>
				)}
				{activeTab === 'completed' && (
					<View style={styles.bookingList}>
						{mockBookings.map((booking) => (
							<MyBookingCard
								key={booking.id}
								{...booking}
								hideActions
							/>
						))}
					</View>
				)}
				{activeTab === 'canceled' && (
					<View style={styles.bookingList}>
						{mockBookings.map((booking) => (
							<MyBookingCard
								key={booking.id}
								{...booking}
								hideActions
							/>
						))}
					</View>
				)}
			</ScrollView>
		</SafeAreaView>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: COLORS.background,
	},
	tabContainerWrapper: {
		marginHorizontal: DIMENSIONS.spacing.lg,
		marginTop: 10,
		marginBottom: 10,
	},
	tabContainer: {
		flexDirection: 'row',
		backgroundColor: COLORS.surface,
		borderRadius: 50,
		padding: 6,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 8,
		elevation: 4,
	},
	tabButton: {
		flex: 1,
		backgroundColor: 'transparent',
		borderRadius: 50,
		paddingVertical: 10,
		marginHorizontal: 2,
		alignItems: 'center',
	},
	tabButtonActive: {
		backgroundColor: COLORS.primary,
	},
	tabText: {
		fontSize: 15,
		color: COLORS.text,
		fontFamily: FontWeight.Medium,
	},
	tabTextActive: {
		color: COLORS.white,
		fontFamily: FontWeight.SemiBold,
	},
	scrollView: {
		flex: 1,
		backgroundColor: COLORS.background,
	},
	scrollContent: {
		paddingBottom: 100,
		paddingHorizontal: DIMENSIONS.spacing.lg,
	},
	bookingList: {
		gap: 20,
	},
	emptyState: {
		alignItems: 'center',
		justifyContent: 'center',
		paddingVertical: 60,
	},
	emptyStateText: {
		color: COLORS.textSecondary,
		fontSize: 16,
	},
});

export default MyBookingsScreen;
