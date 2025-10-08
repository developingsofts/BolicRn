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
} from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";

import BasicTopBar from "../components/BasicTopBar";
import InfoCard from "../components/InfoCard";
import PriceBreakdown, {
	PriceItem,
} from "../components/PriceBreakdown";
import { Toast } from "../components/ToastManager";
import { COLORS, DIMENSIONS } from "../config/constants";
import { r } from "../designing/responsiveDesigns";
import FontWeight from "../hooks/useInterFonts";
import { LeftArrow } from "../../assets";

const BookingConfirmationScreen: React.FC = () => {
	const navigation = useNavigation<NavigationProp<ParamListBase>>();
	const [isProcessing, setIsProcessing] = useState(false);
	const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	const sessionData = useMemo(
		() => ({
			trainer: "Alex",
			dateTime: "Sunday, Oct 14, 2025 at 9:00 AM",
			location: "Downtown Fitness Club",
			priceItems: [
				{ label: "Single Session", amount: 75 },
				{ label: "First-Time Discount", amount: 15, isDiscount: true },
			] as PriceItem[],
			total: 60,
		}),
		[]
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

		setIsProcessing(true);
		Toast.info("Processing your payment...", 1500);

		timeoutRef.current = setTimeout(() => {
			Toast.success(
				"Redirecting to payment",
				2500
			);
			setIsProcessing(false);
		}, 1600);
	}, [isProcessing]);

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
		borderRadius: r(18),
		backgroundColor: COLORS.primary,
		paddingVertical: r(18, "height"),
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
