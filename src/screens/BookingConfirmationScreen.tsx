import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
	ActivityIndicator,
	Image,
	SafeAreaView,
	ScrollView,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import {
	NavigationProp,
	ParamListBase,
	useNavigation,
	useRoute,
	RouteProp,
} from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";

import BasicTopBar from "../components/BasicTopBar";
import InfoCard from "../components/InfoCard";
import PriceBreakdown, {
	PriceItem,
} from "../components/PriceBreakdown";
import PaymentOptionsDialog from "../components/PaymentOptionsDialog";
import { Toast } from "../components/ToastManager";
import { COLORS, DIMENSIONS, toUtc } from "../config/constants";
import { r } from "../designing/responsiveDesigns";
import FontWeight from "../hooks/useInterFonts";
import { LeftArrow } from "../../assets";
import { useCreateBookingMutation } from "../services/api/bookingApi";

type BookingConfirmationParams = {
	priceId?: string;
	trainerId?: string;
	trainerName?: string;
	packageTitle?: string;
	price?: number;
	date?: string;
	time?: string;
	trainerAddress?: string;
	selectedSlots?: { date: string; time: string }[];
};

const BookingConfirmationScreen: React.FC = () => {
	const navigation = useNavigation<NavigationProp<ParamListBase>>();
	const route = useRoute<RouteProp<{ params: BookingConfirmationParams }, 'params'>>();
	const [isProcessing, setIsProcessing] = useState(false);
	const [showPaymentDialog, setShowPaymentDialog] = useState(false);
	const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const [createBooking] = useCreateBookingMutation();

	// Get data from route params or use defaults
	const {
		priceId = "",
		trainerId,
		trainerName = "Alex",
		packageTitle = "Single Session",
		price = 75,
		date = "Sunday, Oct 14, 2025",
		time = "9:00 AM",
		trainerAddress = "Downtown Fitness Club",
		selectedSlots = [],
	} = route.params || {};

	// Format date and time display based on selectedSlots
	const formatDateTimeDisplay = useMemo(() => {
		console.log("Selected Slots for formatting:", selectedSlots);
		if (selectedSlots && selectedSlots.length > 0) {
			// Format date: "MMMM dd, yyyy"
			const firstDate = new Date(selectedSlots[0].date);
			const dateStr = firstDate.toLocaleDateString("en-US", {
				month: "long",
				day: "2-digit",
				year: "numeric",
			});
			
			// Format time based on number of slots
			let timeRange: string;
			if (selectedSlots.length === 1) {
				// Single slot: "at HH:MM AM/PM"
				timeRange = `At ${selectedSlots[0].time}`;
			} else {
				// Multiple slots: "From HH:MM AM/PM to HH:MM AM/PM"
				timeRange = `From ${selectedSlots[0].time} to ${selectedSlots[selectedSlots.length - 1].time}`;
			}
			
			return {
				dateTime: `${dateStr}\n${timeRange}`,
				displayDate: dateStr,
				displayTime: timeRange,
			};
		} else {
			// Single slot or default format
			return {
				dateTime: `${date} at ${time}`,
				displayDate: date,
				displayTime: time,
			};
		}
	}, [selectedSlots, date, time]);

	const sessionData = useMemo(
		() => ({
			trainer: trainerName,
			dateTime: formatDateTimeDisplay.dateTime,
			location: trainerAddress,
			priceItems: [
				{ label: packageTitle, amount: price },
				// { label: "First-Time Discount", amount: 15, isDiscount: true },
			] as PriceItem[],
			// total: price - 15,
			total: price,
		}),
		[trainerName, packageTitle, price, trainerAddress, formatDateTimeDisplay]
	);

	const handleBack = useCallback(() => {
		if (navigation.canGoBack()) {
			navigation.goBack();
		}
		Toast.info("Going back to session selection");
	}, [navigation]);

	const handleProceedToPayment = useCallback(() => {
		if (isProcessing) {
			return;
		}

		// Show payment options dialog instead of processing directly
		setShowPaymentDialog(true);
	}, [isProcessing]);

	const handleConfirmPayment = useCallback((paymentMethod: string) => {
		setShowPaymentDialog(false);
		setIsProcessing(true);
		Toast.info(`Processing payment via ${paymentMethod}...`, 1500);

		(async () => {
			try {
				// Format date as mm/dd/yyyy
				const firstDate = new Date(selectedSlots[0]?.date || date);
				const month = String(firstDate.getMonth() + 1).padStart(2, "0");
				const day = String(firstDate.getDate()).padStart(2, "0");
				const year = firstDate.getFullYear();
				const formattedDate = `${month}/${day}/${year}`;

				// Convert time to UTC using toUtc function
				const timeStr = selectedSlots[0]?.time || time;
				const utcTime = toUtc(timeStr);

				console.log("[BookingConfirmation] Creating booking with:");
				console.log("  Date:", formattedDate);
				console.log("  Time:", timeStr, "->", utcTime);
				console.log("  Trainer ID:", trainerId);
				console.log("  Price ID:", priceId);

				const response = await createBooking({
					trainer_id: trainerId || "",
					price_id: priceId || "",
					date: formattedDate,
					time: utcTime,
					status: "upcomming",
				}).unwrap();

				Toast.success(
					"Payment successful! Your session is booked.",
					2500
				);
				setIsProcessing(false);

				// Navigate to success screen
				navigation.navigate('BookingSuccess', {
					trainerId,
					trainerName,
					dateTime: sessionData.dateTime,
					location: sessionData.location,
				});
			} catch (error: any) {
				console.error("[BookingConfirmation] Booking failed:", error);
				Toast.error(
					error?.data?.message || "Failed to create booking. Please try again.",
					2500
				);
				setIsProcessing(false);
			}
		})();
	}, [navigation, trainerId, trainerName, sessionData, selectedSlots, date, time, createBooking, route.params?.priceId]);

	useEffect(() => {
		return () => {
			if (timeoutRef.current) {
				clearTimeout(timeoutRef.current);
			}
		};
	}, []);

	return (
		<SafeAreaView style={styles.safeArea}>
			<StatusBar style="light" />
			<BasicTopBar
				containerStyle={styles.topBar}
				onBackPress={handleBack}
				backButtonIcon={
					<Image
						source={LeftArrow}
						style={styles.backIcon}
						resizeMode="contain"
					/>
				}
				title="Confirm Your Session"
				subtitle="Go through before you finalize"
				titleStyle={styles.topBarTitle}
				subtitleStyle={styles.topBarSubtitle}
			/>

			<ScrollView
				style={styles.scrollView}
				contentContainerStyle={styles.scrollContent}
				showsVerticalScrollIndicator={false}
			>
				<View style={styles.cardsContainer}>
					<InfoCard
						label="Trainer"
						value={sessionData.trainer}
						icon={
							<Feather
								name="user"
								size={r(18)}
								color={COLORS.primary}
							/>
						}
					/>

					<InfoCard
						label="Date & Time"
						value={sessionData.dateTime}
						icon={
							<Feather
								name="calendar"
								size={r(18)}
								color={COLORS.primary}
							/>
						}
					/>

					<InfoCard
						label="Location"
						value={sessionData.location}
						icon={
							<Feather
								name="map-pin"
								size={r(18)}
								color={COLORS.primary}
							/>
						}
					/>

					<PriceBreakdown
						items={sessionData.priceItems}
						total={sessionData.total}
					/>
				</View>

				<View style={styles.buttonContainer}>
					<TouchableOpacity
						style={[styles.ctaButton, isProcessing && styles.ctaButtonDisabled]}
						activeOpacity={0.85}
						onPress={handleProceedToPayment}
						disabled={isProcessing}
					>
						<View style={styles.buttonContent}>
							{isProcessing ? (
								<>
									<ActivityIndicator color={COLORS.white} size="small" />
									<Text style={styles.buttonText}>Processing...</Text>
								</>
							) : (
								<>
									<Text style={styles.buttonText}>Proceed to Payment</Text>
									<Feather
										name="arrow-right"
										size={r(18)}
										color={COLORS.white}
									/>
								</>
							)}
						</View>
					</TouchableOpacity>
				</View>
			</ScrollView>

			{/* Payment Options Dialog */}
			<PaymentOptionsDialog
				visible={showPaymentDialog}
				onClose={() => setShowPaymentDialog(false)}
				onConfirmPayment={handleConfirmPayment}
				amount={sessionData.total}
				remainingSessions={2}
			/>
		</SafeAreaView>
	);
};

const styles = StyleSheet.create({
	safeArea: {
		flex: 1,
		backgroundColor: COLORS.background,
	},
	topBar: {
		paddingTop: DIMENSIONS.spacing.xxl,
		paddingBottom: DIMENSIONS.spacing.lg,
	},
	backIcon: {
		width: 28,
		height: 28,
		tintColor: COLORS.white,
	},
	topBarTitle: {
		fontFamily: FontWeight.SemiBold,
		fontSize: 24,
		color: COLORS.white,
	},
	topBarSubtitle: {
		fontFamily: FontWeight.Regular,
		fontSize: 14,
		color: COLORS.white,
		opacity: 0.9,
	},
	scrollView: {
		flex: 1,
	},
	scrollContent: {
		paddingHorizontal: r(20),
		paddingVertical: r(24, "height"),
		gap: r(24, "height"),
	},
	cardsContainer: {
		gap: r(16, "height"),
	},
	buttonContainer: {
		marginTop: r(12, "height"),
	},
	ctaButton: {
		borderRadius: r(5),
		backgroundColor: COLORS.primary,
		paddingVertical: r(10, "height"),
		paddingHorizontal: r(24),
		shadowColor: COLORS.primary,
		shadowOffset: { width: 0, height: 8 },
		shadowOpacity: 0.25,
		shadowRadius: 12,
		elevation: 6,
	},
	ctaButtonDisabled: {
		opacity: 0.7,
	},
	buttonContent: {
		flexDirection: "row",
		justifyContent: "center",
		alignItems: "center",
		gap: r(10),
	},
	buttonText: {
		color: COLORS.white,
		fontFamily: FontWeight.SemiBold,
		fontSize: r(16, "font"),
	},
});

export default BookingConfirmationScreen;
