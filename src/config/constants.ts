
export const APP_CONFIG = {
  name: "Bolic",
  version: "1.0.0",
  description: "Find your perfect training partner",
};

export const API_CONFIG = {
  baseUrl: "http://13.62.87.191:4000/api",
  timeout: 10000,
  retryAttempts: 3,
};

export const SOCKET_CONFIG = {
  baseUrl:
    process.env.EXPO_PUBLIC_SOCKET_URL ||
    (API_CONFIG.baseUrl.endsWith("/api")
      ? API_CONFIG.baseUrl.slice(0, -4)
      : API_CONFIG.baseUrl),
  path: process.env.EXPO_PUBLIC_SOCKET_PATH || "/socket.io",
};

export const FIREBASE_CONFIG = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

export const LOCATION_CONFIG = {
  defaultRadius: 10,
  maxRadius: 50,
  updateInterval: 5000,
  distanceInterval: 10,
  geocodeSuggestUrl:
    "https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/suggest",
};

export const NOTIFICATION_CONFIG = {
  defaultReminderTime: "18:00",
  defaultReminderDays: [1, 2, 3, 4, 5, 6, 0],
  quietHours: {
    enabled: false,
    start: "22:00",
    end: "08:00",
  },
};

export const toUtc = (timeStr: string) => {
  console.log(
    "[toUtc] Input timeStr:",
    JSON.stringify(timeStr),
    "length:",
    timeStr?.length
  );
  if (!timeStr) {
    console.log("[toUtc] Empty input, returning empty string");
    return "";
  }
  const cleaned = timeStr
    .replace(
      /[\u202F\u00A0\u2007\u2060\u2009\u200A\u200B\u200C\u200D\uFEFF\s]+/g,
      " "
    )
    .trim();
  console.log("[toUtc] After cleanup:", JSON.stringify(cleaned));
  const match = cleaned.match(/(\d{1,2}):(\d{2}) ?([AP]M)/i);
  console.log("[toUtc] Regex match:", match);
  if (!match) {
    console.log("[toUtc] No regex match, returning empty string");
    return "";
  }
  let localHour = parseInt(match[1], 10);
  let localMinute = parseInt(match[2], 10);
  const ampm = match[3].toUpperCase();
  console.log(
    "[toUtc] Parsed (12-hour): hour:",
    localHour,
    "minute:",
    localMinute,
    "ampm:",
    ampm
  );

  if (ampm === "PM" && localHour < 12) localHour += 12;
  if (ampm === "AM" && localHour === 12) localHour = 0;
  console.log("[toUtc] 24-hour format (local):", localHour);

  const tzOffsetMinutes = new Date().getTimezoneOffset();
  console.log("[toUtc] Timezone offset (minutes):", tzOffsetMinutes);


  let totalLocalMinutes = localHour * 60 + localMinute;
  console.log("[toUtc] Total local minutes:", totalLocalMinutes);

  let totalUtcMinutes = totalLocalMinutes + tzOffsetMinutes;
  console.log("[toUtc] Total UTC minutes (before wrap):", totalUtcMinutes);

  if (totalUtcMinutes < 0) totalUtcMinutes += 24 * 60;
  if (totalUtcMinutes >= 24 * 60) totalUtcMinutes -= 24 * 60;

  console.log("[toUtc] Total UTC minutes (after wrap):", totalUtcMinutes);

  let utcHour = Math.floor(totalUtcMinutes / 60);
  let utcMinute = totalUtcMinutes % 60;

  console.log("[toUtc] UTC hour:", utcHour, "UTC minute:", utcMinute);

  let displayHour = utcHour;
  let displayAmpm = displayHour >= 12 ? "PM" : "AM";
  displayHour = displayHour % 12;
  if (displayHour === 0) displayHour = 12;

  const hourStr = displayHour < 10 ? `0${displayHour}` : `${displayHour}`;
  const minStr = utcMinute.toString().padStart(2, "0");
  displayAmpm = displayAmpm.toUpperCase();
  const result = `${hourStr}:${minStr} ${displayAmpm}`;
  console.log("[toUtc] Final result (UTC):", result);
  return result;
};

export const toLocalTime = (utcStr: string) => {
  console.log("[toLocalTime] Input utcStr:", JSON.stringify(utcStr));
  if (!utcStr) return "";

  if (utcStr.includes("AM") || utcStr.includes("PM")) {
    console.log(
      "[toLocalTime] Input is already 12-hour format, parsing as UTC time"
    );
    const cleaned = utcStr
      .replace(
        /[\u202F\u00A0\u2007\u2060\u2009\u200A\u200B\u200C\u200D\uFEFF\s]+/g,
        " "
      )
      .trim();
    const match = cleaned.match(/(\d{1,2}):(\d{2}) ?([AP]M)/i);

    if (!match) {
      console.log("[toLocalTime] Could not parse 12-hour format");
      return utcStr;
    }

    let utcHour = parseInt(match[1], 10);
    const utcMinute = parseInt(match[2], 10);
    const ampm = match[3].toUpperCase();

    if (ampm === "PM" && utcHour < 12) utcHour += 12;
    if (ampm === "AM" && utcHour === 12) utcHour = 0;

    console.log("[toLocalTime] UTC 24-hour:", utcHour, "minute:", utcMinute);

    const tzOffsetMinutes = new Date().getTimezoneOffset();
    console.log("[toLocalTime] Timezone offset (minutes):", tzOffsetMinutes);


    let totalUtcMinutes = utcHour * 60 + utcMinute;
    let totalLocalMinutes = totalUtcMinutes - tzOffsetMinutes;

    console.log("[toLocalTime] Total UTC minutes:", totalUtcMinutes);
    console.log(
      "[toLocalTime] Total local minutes (before wrap):",
      totalLocalMinutes
    );

    if (totalLocalMinutes < 0) totalLocalMinutes += 24 * 60;
    if (totalLocalMinutes >= 24 * 60) totalLocalMinutes -= 24 * 60;

    console.log(
      "[toLocalTime] Total local minutes (after wrap):",
      totalLocalMinutes
    );

    let localHour = Math.floor(totalLocalMinutes / 60);
    let localMinute = totalLocalMinutes % 60;

    console.log(
      "[toLocalTime] Local hour:",
      localHour,
      "Local minute:",
      localMinute
    );

    let displayHour = localHour;
    let displayAmpm = displayHour >= 12 ? "PM" : "AM";
    displayHour = displayHour % 12;
    if (displayHour === 0) displayHour = 12;

    const hourStr = displayHour < 10 ? `0${displayHour}` : `${displayHour}`;
    const minStr = localMinute.toString().padStart(2, "0");
    const result = `${hourStr}:${minStr} ${displayAmpm}`;
    console.log("[toLocalTime] Final result (local):", result);
    return result;
  }

  const date = new Date(utcStr);
  if (isNaN(date.getTime())) {
    console.log("[toLocalTime] Invalid date format");
    return "";
  }

  let hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12;
  if (hours === 0) hours = 12;
  const hourStr = hours.toString().padStart(2, "0");
  const minStr = minutes.toString().padStart(2, "0");
  const result = `${hourStr}:${minStr} ${ampm}`;
  console.log("[toLocalTime] Final result (from ISO):", result);
  return result;
};

export const convertLocaDatemmddyyyylToUTC = (
  localDate: string,
  localTime: string
): { utcDate: string; utcTime: string } => {
  console.log(
    "[convertLocalToUTC] Input - Date:",
    localDate,
    "Time:",
    localTime
  );

  try {
    let dateObj: Date;
    if (localDate.includes("-")) {
      dateObj = new Date(localDate + "T00:00:00");
    } else if (localDate.includes("/")) {
      const [month, day, year] = localDate.split("/");
      dateObj = new Date(`${year}-${month}-${day}T00:00:00`);
    } else {
      dateObj = new Date(localDate);
    }

    console.log("[convertLocalToUTC] Parsed date object:", dateObj);

    if (isNaN(dateObj.getTime())) {
      throw new Error("Invalid date format");
    }

    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, "0");
    const day = String(dateObj.getDate()).padStart(2, "0");

    const timeMatch = localTime.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
    if (!timeMatch) {
      throw new Error('Invalid time format. Expected "HH:MM AM/PM"');
    }

    let hours = parseInt(timeMatch[1], 10);
    const minutes = parseInt(timeMatch[2], 10);
    const ampm = timeMatch[3].toUpperCase();

    if (ampm === "PM" && hours < 12) hours += 12;
    if (ampm === "AM" && hours === 12) hours = 0;

    console.log(
      "[convertLocalToUTC] Local time in 24-hour format: " +
      hours +
      ":" +
      String(minutes).padStart(2, "0")
    );

    const tzOffsetMinutes = new Date().getTimezoneOffset();
    console.log(
      "[convertLocalToUTC] Timezone offset (minutes):",
      tzOffsetMinutes
    );

    const totalLocalMinutes = hours * 60 + minutes;
    const totalUtcMinutes = totalLocalMinutes + tzOffsetMinutes;

    console.log("[convertLocalToUTC] Total local minutes:", totalLocalMinutes);
    console.log(
      "[convertLocalToUTC] Total UTC minutes (before wrap):",
      totalUtcMinutes
    );

    let utcHours = Math.floor(totalUtcMinutes / 60);
    let utcMinutes = totalUtcMinutes % 60;

    let utcDay = parseInt(day, 10);
    let utcMonth = parseInt(month, 10);
    let utcYear = year;

    if (totalUtcMinutes < 0) {
      utcDay -= 1;
      if (utcDay < 1) {
        utcMonth -= 1;
        if (utcMonth < 1) {
          utcMonth = 12;
          utcYear -= 1;
        }
        const lastDay = new Date(utcYear, utcMonth, 0).getDate();
        utcDay = lastDay;
      }
      utcHours = (24 + totalUtcMinutes / 60) % 24;
    } else if (totalUtcMinutes >= 24 * 60) {
      utcDay += 1;
      const lastDay = new Date(utcYear, utcMonth + 1, 0).getDate();
      if (utcDay > lastDay) {
        utcDay = 1;
        utcMonth += 1;
        if (utcMonth > 12) {
          utcMonth = 1;
          utcYear += 1;
        }
      }
      utcHours = (totalUtcMinutes / 60) % 24;
    }

    utcHours = Math.floor(utcHours) % 24;
    if (utcHours < 0) utcHours += 24;

    console.log(
      "[convertLocalToUTC] UTC hours:",
      utcHours,
      "UTC minutes:",
      utcMinutes
    );

    const formattedUtcDate = `${String(utcMonth).padStart(2, "0")}/${String(
      utcDay
    ).padStart(2, "0")}/${utcYear}`;

    let displayHours = utcHours;
    const displayAmpm = utcHours >= 12 ? "PM" : "AM";
    displayHours = displayHours % 12;
    if (displayHours === 0) displayHours = 12;
    const formattedUtcTime = `${String(displayHours).padStart(2, "0")}:${String(
      Math.round(utcMinutes)
    ).padStart(2, "0")} ${displayAmpm}`;

    console.log("[convertLocalToUTC] Conversion result:");
    console.log("  Local:", localDate, "@", localTime);
    console.log("  UTC Date:", formattedUtcDate);
    console.log("  UTC Time:", formattedUtcTime);

    return {
      utcDate: formattedUtcDate,
      utcTime: formattedUtcTime,
    };
  } catch (error) {
    console.error("[convertLocalToUTC] Error:", error);
    return {
      utcDate: "",
      utcTime: "",
    };
  }
};

export const formatUTCToDisplayDateTime = (
  utcIsoDate: string,
  time: string
): { date: string; time: string } => {
  console.log(
    "[formatUTCToDisplayDateTime] Input - ISO Date:",
    utcIsoDate,
    "UTC Time:",
    time
  );

  try {
    if (!utcIsoDate || !time) {
      console.log("[formatUTCToDisplayDateTime] Empty input");
      return { date: "", time: "" };
    }

    const date = new Date(utcIsoDate);
    if (isNaN(date.getTime())) {
      throw new Error("Invalid ISO date format");
    }

    const dayNames = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    const monthNamesShort = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];

    const dayName = dayNames[date.getUTCDay()];
    const monthShort = monthNamesShort[date.getUTCMonth()];
    const dayOfMonth = date.getUTCDate();
    const year = date.getUTCFullYear();

    const timeMatch = time.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
    if (!timeMatch) {
      throw new Error('Invalid time format. Expected "HH:MM AM/PM"');
    }

    let utcHour = parseInt(timeMatch[1], 10);
    const utcMinute = parseInt(timeMatch[2], 10);
    const ampm = timeMatch[3].toUpperCase();

    if (ampm === "PM" && utcHour < 12) utcHour += 12;
    if (ampm === "AM" && utcHour === 12) utcHour = 0;

    console.log(
      "[formatUTCToDisplayDateTime] UTC time in 24-hour:",
      utcHour,
      ":",
      utcMinute
    );

    const tzOffsetMinutes = new Date().getTimezoneOffset();
    console.log(
      "[formatUTCToDisplayDateTime] Timezone offset (minutes):",
      tzOffsetMinutes
    );

    const totalUtcMinutes = utcHour * 60 + utcMinute;
    const totalLocalMinutes = totalUtcMinutes - tzOffsetMinutes;

    console.log(
      "[formatUTCToDisplayDateTime] Total UTC minutes:",
      totalUtcMinutes
    );
    console.log(
      "[formatUTCToDisplayDateTime] Total local minutes (before wrap):",
      totalLocalMinutes
    );

    let localHours = Math.floor(totalLocalMinutes / 60);
    let localMinutes = totalLocalMinutes % 60;

    let displayDayName = dayName;
    let displayMonth = monthShort;
    let displayDayOfMonth = dayOfMonth;
    let displayYear = year;

    if (totalLocalMinutes < 0) {
      const prevDate = new Date(date);
      prevDate.setUTCDate(prevDate.getUTCDate() - 1);
      displayDayName = dayNames[prevDate.getUTCDay()];
      displayMonth = monthNamesShort[prevDate.getUTCMonth()];
      displayDayOfMonth = prevDate.getUTCDate();
      displayYear = prevDate.getUTCFullYear();
      localHours = (24 + totalLocalMinutes / 60) % 24;
    } else if (totalLocalMinutes >= 24 * 60) {
      const nextDate = new Date(date);
      nextDate.setUTCDate(nextDate.getUTCDate() + 1);
      displayDayName = dayNames[nextDate.getUTCDay()];
      displayMonth = monthNamesShort[nextDate.getUTCMonth()];
      displayDayOfMonth = nextDate.getUTCDate();
      displayYear = nextDate.getUTCFullYear();
      localHours = (totalLocalMinutes / 60) % 24;
    }

    localHours = Math.floor(localHours) % 24;
    if (localHours < 0) localHours += 24;

    console.log(
      "[formatUTCToDisplayDateTime] Local time in 24-hour:",
      localHours,
      ":",
      Math.round(localMinutes)
    );

    let displayLocalHour = localHours;
    const displayLocalAmpm = localHours >= 12 ? "PM" : "AM";
    displayLocalHour = displayLocalHour % 12;
    if (displayLocalHour === 0) displayLocalHour = 12;

    const localTimeStr = `${String(displayLocalHour).padStart(2, "0")}:${String(
      Math.round(localMinutes)
    ).padStart(2, "0")} ${displayLocalAmpm}`;

    const dateformatted = `${displayDayName} - ${displayMonth} ${displayDayOfMonth}, ${displayYear}`;
    const timeFormatted = localTimeStr;

    console.log("[formatUTCToDisplayDateTime] Result:");
    console.log("  Date:", dateformatted);
    console.log("  Time (converted to local):", timeFormatted);

    return { date: dateformatted, time: timeFormatted };
  } catch (error) {
    console.error("[formatUTCToDisplayDateTime] Error:", error);
    return { date: "", time: "" };
  }
};

export const convertBookingDateTommddyyyyFormat = (
  dateString: string
): string => {
  const dateMatch = dateString.match(/(\w+)\s*-\s*(\w+)\s+(\d+),\s*(\d+)/);

  if (!dateMatch) {
    return dateString;
  }

  const monthStr = dateMatch[2];
  const dayStr = dateMatch[3];
  const yearStr = dateMatch[4];

  const monthMap: { [key: string]: string } = {
    Jan: "01",
    Feb: "02",
    Mar: "03",
    Apr: "04",
    May: "05",
    Jun: "06",
    Jul: "07",
    Aug: "08",
    Sep: "09",
    Oct: "10",
    Nov: "11",
    Dec: "12",
  };

  const monthNum = monthMap[monthStr] || "01";
  return `${monthNum}/${dayStr.padStart(2, "0")}/${yearStr}`;
};

export const addOneHourToTime = (time: string): string => {
  console.log("[addOneHourToTime] Input time:", time);

  try {
    if (!time) {
      console.log("[addOneHourToTime] Empty input");
      return "";
    }

    const timeMatch = time.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
    if (!timeMatch) {
      throw new Error('Invalid time format. Expected "HH:MM AM/PM"');
    }

    let hours = parseInt(timeMatch[1], 10);
    const minutes = parseInt(timeMatch[2], 10);
    const ampm = timeMatch[3].toUpperCase();

    if (ampm === "PM" && hours < 12) hours += 12;
    if (ampm === "AM" && hours === 12) hours = 0;

    console.log(
      "[addOneHourToTime] Time in 24-hour format:",
      hours,
      ":",
      minutes
    );

    hours += 1;

    if (hours >= 24) {
      hours = 0;
    }

    console.log(
      "[addOneHourToTime] After adding 1 hour (24-hour):",
      hours,
      ":",
      minutes
    );

    let displayHour = hours;
    const displayAmpm = hours >= 12 ? "PM" : "AM";
    displayHour = displayHour % 12;
    if (displayHour === 0) displayHour = 12;

    const result = `${String(displayHour).padStart(2, "0")}:${String(
      minutes
    ).padStart(2, "0")} ${displayAmpm}`;

    console.log("[addOneHourToTime] Result:", result);
    return result;
  } catch (error) {
    console.error("[addOneHourToTime] Error:", error);
    return "";
  }
};

export const XP_CONFIG = {
  workoutCompletion: 50,
  achievementEarned: 100,
  postCreated: 10,
  messageSent: 5,
  noteSaved: 5,
  ratingGiven: 5,
  streakMilestone: 25,
  goalMilestone: 15,
  xpPerLevel: 1000,
};

export const MATCHING_CONFIG = {
  minCompatibilityScore: 50,
  maxDistance: 50,
  mutualMatchChance: 0.3,
};

export const WORKOUT_CONFIG = {
  defaultDuration: 60,
  defaultCalories: 300,
  exerciseTypes: ["strength", "cardio", "flexibility", "mixed"],
  difficultyLevels: ["easy", "medium", "hard"],
};

export const TRAINING_TYPES = [
  "Powerlifting",
  "BodyBuilding",
  "Lifestyle",
  "Hybrid",
  "CrossFit",
  "Olympic Lifting",
  "Functional Fitness",
  "Yoga",
  "Pilates",
  "Running",
  "Cycling",
  "Swimming",
  "Strength",
  "Cardio"
];

export const GENDER_OPTIONS = [
  "Male",
  "Female",
  "Non-binary",
  "Prefer not to say",
];

export const GENDER_PREFERENCE_OPTIONS = [
  "All",
  "Same Gender Only",
  "Opposite Gender Only",
];

export const TRAINING_SCHEDULE_OPTIONS = [
  "AM",
  "PM",
  "Flexible",
  "Weekends Only",
];

export const YEARS_TRAINING_OPTIONS = [
  "Less than 1 year",
  "1-2 years",
  "3-5 years",
  "5-10 years",
  "10+ years",
];

export const STORAGE_KEYS = {
  authToken: "authToken",
  userProfile: "userProfile",
  userStats: "userStats",
  notificationSettings: "notificationSettings",
  workoutSessions: "workoutSessions",
  progressGoals: "progressGoals",
  trainingPartners: "trainingPartners",
  messages: "messages",
  groups: "groups",
  notifications: "notifications",
  posts: "posts",
  ratings: "ratings",
  achievements: "achievements",
  notepadNotes: "notepadNotes",
};

export const ERROR_MESSAGES = {
  networkError: "Network error. Please check your connection.",
  authenticationError: "Authentication failed. Please try again.",
  locationError: "Location access is required to find nearby partners.",
  notificationError: "Notification permission is required for reminders.",
  generalError: "Something went wrong. Please try again.",
  validationError: "Please check your input and try again.",
};

export const SUCCESS_MESSAGES = {
  loginSuccess: "Successfully signed in!",
  registrationSuccess: "Account created successfully!",
  logoutSuccess: "Logged out successfully",
  profileUpdateSuccess: "Profile updated successfully!",
  workoutComplete: "Workout completed successfully!",
  goalCreated: "Goal created successfully!",
  postCreated: "Post created successfully!",
  messageSent: "Message sent successfully!",
  noteSaved: "Note saved successfully!",
  ratingSubmitted: "Rating submitted successfully!",
};

export const COLORS = {
  primary: "#FFFFFF",
  secondary: "#B0B0B0",
  success: "#34C759",
  warning: "#FF9500",
  error: "#FF453A",
  background: "#0A0A0A",
  surface: "#171717",
  text: "#FFFFFF",
  textSecondary: "#A1A1A1",
  border: "#2A2A2A",
  card: "#171717",
  black: "#000000",
  _3A63ED: "#4C79FF",
  white: "#FFFFFF",
  placeholder: "#6B6B6B",
  _191919: "#F2F2F2",
  _C9E3FF: "#16324A",
  _383838: "#D0D0D0",
  _E6E6E6: "#242424",
  _DA9393: "#DA9393",
  border_dark: "#2A2A2A",
  app_black: "#FFFFFF",
  _BFDEFF: "#16324A",
  _E5E7EB: "#242424",
  _109320: "#0FB524",
  _0DB312: "#0DB312",
  _5E5E5E: "#A1A1A1",
  _818181: "#9A9A9A",
  _999999: "#8A8A8A",
  _C9C9C9: "#333333",
  _FFC362: "#FFC362",
  _FFF5E9: "#2A2116",
  _B9780E: "#E0A64A",
  gradient1: "#000000",
  gradient2: "#0D0D0D",
  gradient3: "#171717",
  _D9D9D9: "#2E2E2E",
  _FF1616: "#FF4D4D",
  _E2E2E2: "#242424",
  _222222: "#EDEDED",
  _EB3434: "#EB4B4B",
  _E6E6E7: "#242424",
  _D7D7D7: "#2E2E2E",
  _EAEBF4: "#1C1C22",
  _616888: "#AEB4C7",
  _595D66: "#A1A1A1",
  _CCCCCC: "#333333",
  _D2E7FF: "#16324A",
  _0B80FF: "#2E90FF",
  _3FE363: "#3FE363",
  _F3A455: "#F3A455",
  _2E6BDD: "#3B78EA",
  buttonGrayBg: "#242424",
  buttonGrayText: "#A1A1A1",
  chatReceiverBg: "#232334",
  chatMessageListBg: "#0F0F0F",
  chatDateSeparatorLine: "#2A2A2A",
  chatDateSeparatorText: "#A1A1A1",
};

export const DIMENSIONS = {
  screenWidth: 375,
  screenHeight: 812,
  cardWidth: 320,
  cardHeight: 480,
  buttonHeight: 44,
  inputHeight: 44,
  borderRadius: 12,
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
};

export const ANIMATION_CONFIG = {
  duration: {
    fast: 200,
    normal: 300,
    slow: 500,
  },
  easing: {
    ease: "ease",
    easeIn: "ease-in",
    easeOut: "ease-out",
    easeInOut: "ease-in-out",
  },
};
