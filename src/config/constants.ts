// Convert UTC ISO string (e.g., '2025-12-02T09:00:00.000Z') to local 12-hour time string (e.g., '09:00 AM')

// App Configuration
export const APP_CONFIG = {
  name: "Bolic",
  version: "1.0.0",
  description: "Find your perfect training partner",
};

// API Configuration
export const API_CONFIG = {
  // baseUrl: process.env.EXPO_PUBLIC_API_URL || 'https://api.bolicbuddy.com',
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

// Firebase Configuration
export const FIREBASE_CONFIG = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

// Location Configuration
export const LOCATION_CONFIG = {
  defaultRadius: 10, // km
  maxRadius: 50, // km
  updateInterval: 5000, // ms
  distanceInterval: 10, // meters
  geocodeSuggestUrl:
    "https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/suggest",
};

// Notification Configuration
export const NOTIFICATION_CONFIG = {
  defaultReminderTime: "18:00",
  defaultReminderDays: [1, 2, 3, 4, 5, 6, 0], // All days
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
  // Remove all Unicode spaces and normalize whitespace
  const cleaned = timeStr
    .replace(
      /[\u202F\u00A0\u2007\u2060\u2009\u200A\u200B\u200C\u200D\uFEFF\s]+/g,
      " "
    )
    .trim();
  console.log("[toUtc] After cleanup:", JSON.stringify(cleaned));
  // Parse 12-hour time string (e.g., 09:00 AM)
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

  // Convert 12-hour to 24-hour for local time
  if (ampm === "PM" && localHour < 12) localHour += 12;
  if (ampm === "AM" && localHour === 12) localHour = 0;
  console.log("[toUtc] 24-hour format (local):", localHour);

  // Get timezone offset in minutes
  // For India (UTC+5:30): offset = -330 minutes (negative because ahead of UTC)
  const tzOffsetMinutes = new Date().getTimezoneOffset();
  console.log("[toUtc] Timezone offset (minutes):", tzOffsetMinutes);

  // Convert local time to UTC by subtracting the offset
  // offset is negative for timezones ahead of UTC, so subtracting a negative = adding
  // Example: India (UTC+5:30, offset=-330)
  // 09:30 AM local - (-330 minutes) = 09:30 + 5:30 = 15:00 (3 PM) ... WAIT that's wrong
  // Let me recalculate: 09:30 AM in India should be 04:00 AM UTC
  // So: 09:30 - 5:30 = 04:00
  // Which means: localTime - (+5:30) = UTC
  // So we need to SUBTRACT the offset value when offset is negative
  // offset=-330 means we SUBTRACT (-330) which means ADD 330... no wait

  // Simpler way: total minutes from midnight
  let totalLocalMinutes = localHour * 60 + localMinute;
  console.log("[toUtc] Total local minutes:", totalLocalMinutes);

  // Subtract timezone offset to get UTC
  // offset=-330 (India ahead of UTC), so UTC = local - 5:30 hours
  // We need to subtract the POSITIVE offset from local time
  // Since offset is -330, we use: totalMinutes - (-(-330)) = totalMinutes - 330
  let totalUtcMinutes = totalLocalMinutes + tzOffsetMinutes;
  console.log("[toUtc] Total UTC minutes (before wrap):", totalUtcMinutes);

  // Handle day wrapping
  if (totalUtcMinutes < 0) totalUtcMinutes += 24 * 60;
  if (totalUtcMinutes >= 24 * 60) totalUtcMinutes -= 24 * 60;

  console.log("[toUtc] Total UTC minutes (after wrap):", totalUtcMinutes);

  // Convert back to hours and minutes
  let utcHour = Math.floor(totalUtcMinutes / 60);
  let utcMinute = totalUtcMinutes % 60;

  console.log("[toUtc] UTC hour:", utcHour, "UTC minute:", utcMinute);

  // Format as hh:mm AM/PM in UTC
  let displayHour = utcHour;
  let displayAmpm = displayHour >= 12 ? "PM" : "AM";
  displayHour = displayHour % 12;
  if (displayHour === 0) displayHour = 12;

  // Always pad with 0 if less than 10
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

  // Handle 12-hour format input (e.g., "04:00 AM")
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

    // Convert 12-hour to 24-hour
    if (ampm === "PM" && utcHour < 12) utcHour += 12;
    if (ampm === "AM" && utcHour === 12) utcHour = 0;

    console.log("[toLocalTime] UTC 24-hour:", utcHour, "minute:", utcMinute);

    // Get timezone offset
    const tzOffsetMinutes = new Date().getTimezoneOffset();
    console.log("[toLocalTime] Timezone offset (minutes):", tzOffsetMinutes);

    // Convert UTC to local time
    // UTC time + timezone offset = local time
    // For India (UTC+5:30, offset=-330): 04:00 UTC + (-330 min) = 04:00 - 5:30 = 22:30 previous day
    // Wait, that's wrong. Let me recalculate:
    // offset=-330 means device is 330 minutes AHEAD of UTC
    // So local = UTC - offset = UTC - (-330) = UTC + 330
    // 04:00 UTC + 330 min = 04:00 + 5:30 = 09:30 AM ✓

    let totalUtcMinutes = utcHour * 60 + utcMinute;
    let totalLocalMinutes = totalUtcMinutes - tzOffsetMinutes;

    console.log("[toLocalTime] Total UTC minutes:", totalUtcMinutes);
    console.log(
      "[toLocalTime] Total local minutes (before wrap):",
      totalLocalMinutes
    );

    // Handle day wrapping
    if (totalLocalMinutes < 0) totalLocalMinutes += 24 * 60;
    if (totalLocalMinutes >= 24 * 60) totalLocalMinutes -= 24 * 60;

    console.log(
      "[toLocalTime] Total local minutes (after wrap):",
      totalLocalMinutes
    );

    // Convert back to hours and minutes
    let localHour = Math.floor(totalLocalMinutes / 60);
    let localMinute = totalLocalMinutes % 60;

    console.log(
      "[toLocalTime] Local hour:",
      localHour,
      "Local minute:",
      localMinute
    );

    // Format as 12-hour
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

  // Handle ISO format (e.g., "2025-12-02T04:00:00.000Z")
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

// Convert local date and time to UTC date and time
// Returns object with utcDate (mm/dd/yyyy) and utcTime (HH:MM AM/PM)
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
    // Parse local date (expected format: "mm/dd/yyyy" or "YYYY-MM-DD")
    let dateObj: Date;
    if (localDate.includes("-")) {
      // ISO format: "2025-12-03"
      dateObj = new Date(localDate + "T00:00:00");
    } else if (localDate.includes("/")) {
      // mm/dd/yyyy format
      const [month, day, year] = localDate.split("/");
      dateObj = new Date(`${year}-${month}-${day}T00:00:00`);
    } else {
      // Fallback: assume it's a date string
      dateObj = new Date(localDate);
    }

    console.log("[convertLocalToUTC] Parsed date object:", dateObj);

    if (isNaN(dateObj.getTime())) {
      throw new Error("Invalid date format");
    }

    // Get initial date components
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, "0");
    const day = String(dateObj.getDate()).padStart(2, "0");

    // Parse time string to extract hours and minutes (supports formats like "09:30 AM" or "9:30 AM")
    const timeMatch = localTime.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
    if (!timeMatch) {
      throw new Error('Invalid time format. Expected "HH:MM AM/PM"');
    }

    let hours = parseInt(timeMatch[1], 10);
    const minutes = parseInt(timeMatch[2], 10);
    const ampm = timeMatch[3].toUpperCase();

    // Convert 12-hour to 24-hour format
    if (ampm === "PM" && hours < 12) hours += 12;
    if (ampm === "AM" && hours === 12) hours = 0;

    console.log(
      "[convertLocalToUTC] Local time in 24-hour format: " +
      hours +
      ":" +
      String(minutes).padStart(2, "0")
    );

    // Get timezone offset in minutes
    const tzOffsetMinutes = new Date().getTimezoneOffset();
    console.log(
      "[convertLocalToUTC] Timezone offset (minutes):",
      tzOffsetMinutes
    );

    // Convert to total minutes and adjust for timezone
    const totalLocalMinutes = hours * 60 + minutes;
    const totalUtcMinutes = totalLocalMinutes + tzOffsetMinutes;

    console.log("[convertLocalToUTC] Total local minutes:", totalLocalMinutes);
    console.log(
      "[convertLocalToUTC] Total UTC minutes (before wrap):",
      totalUtcMinutes
    );

    // Calculate UTC hours and minutes
    let utcHours = Math.floor(totalUtcMinutes / 60);
    let utcMinutes = totalUtcMinutes % 60;

    // Handle day wrapping
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

    // Ensure utcHours is in valid range
    utcHours = Math.floor(utcHours) % 24;
    if (utcHours < 0) utcHours += 24;

    console.log(
      "[convertLocalToUTC] UTC hours:",
      utcHours,
      "UTC minutes:",
      utcMinutes
    );

    // Format UTC date as mm/dd/yyyy
    const formattedUtcDate = `${String(utcMonth).padStart(2, "0")}/${String(
      utcDay
    ).padStart(2, "0")}/${utcYear}`;

    // Format UTC time as HH:MM AM/PM (12-hour format)
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

// Convert UTC ISO date string and time to display format with local time conversion
// Input: utcIsoDate (e.g., "2025-12-03T05:09:26.795Z"), time (e.g., "05:09 AM" in UTC)
// Output: {date: "Wednesday - Dec 3, 2025", time: "10:39 AM"} (converted to local time)
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

    // Parse UTC ISO date
    const date = new Date(utcIsoDate);
    if (isNaN(date.getTime())) {
      throw new Error("Invalid ISO date format");
    }

    // Get date components
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

    // Parse UTC time string
    const timeMatch = time.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
    if (!timeMatch) {
      throw new Error('Invalid time format. Expected "HH:MM AM/PM"');
    }

    let utcHour = parseInt(timeMatch[1], 10);
    const utcMinute = parseInt(timeMatch[2], 10);
    const ampm = timeMatch[3].toUpperCase();

    // Convert 12-hour to 24-hour format for UTC
    if (ampm === "PM" && utcHour < 12) utcHour += 12;
    if (ampm === "AM" && utcHour === 12) utcHour = 0;

    console.log(
      "[formatUTCToDisplayDateTime] UTC time in 24-hour:",
      utcHour,
      ":",
      utcMinute
    );

    // Get timezone offset in minutes
    const tzOffsetMinutes = new Date().getTimezoneOffset();
    console.log(
      "[formatUTCToDisplayDateTime] Timezone offset (minutes):",
      tzOffsetMinutes
    );

    // Convert UTC to local time
    // local = UTC - offset (because offset is negative for timezones ahead of UTC)
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

    // Calculate local hours and minutes with day wrapping
    let localHours = Math.floor(totalLocalMinutes / 60);
    let localMinutes = totalLocalMinutes % 60;

    // Handle day wrapping for display
    let displayDayName = dayName;
    let displayMonth = monthShort;
    let displayDayOfMonth = dayOfMonth;
    let displayYear = year;

    if (totalLocalMinutes < 0) {
      // Previous day
      const prevDate = new Date(date);
      prevDate.setUTCDate(prevDate.getUTCDate() - 1);
      displayDayName = dayNames[prevDate.getUTCDay()];
      displayMonth = monthNamesShort[prevDate.getUTCMonth()];
      displayDayOfMonth = prevDate.getUTCDate();
      displayYear = prevDate.getUTCFullYear();
      localHours = (24 + totalLocalMinutes / 60) % 24;
    } else if (totalLocalMinutes >= 24 * 60) {
      // Next day
      const nextDate = new Date(date);
      nextDate.setUTCDate(nextDate.getUTCDate() + 1);
      displayDayName = dayNames[nextDate.getUTCDay()];
      displayMonth = monthNamesShort[nextDate.getUTCMonth()];
      displayDayOfMonth = nextDate.getUTCDate();
      displayYear = nextDate.getUTCFullYear();
      localHours = (totalLocalMinutes / 60) % 24;
    }

    // Ensure valid range
    localHours = Math.floor(localHours) % 24;
    if (localHours < 0) localHours += 24;

    console.log(
      "[formatUTCToDisplayDateTime] Local time in 24-hour:",
      localHours,
      ":",
      Math.round(localMinutes)
    );

    // Convert 24-hour local time back to 12-hour format
    let displayLocalHour = localHours;
    const displayLocalAmpm = localHours >= 12 ? "PM" : "AM";
    displayLocalHour = displayLocalHour % 12;
    if (displayLocalHour === 0) displayLocalHour = 12;

    const localTimeStr = `${String(displayLocalHour).padStart(2, "0")}:${String(
      Math.round(localMinutes)
    ).padStart(2, "0")} ${displayLocalAmpm}`;

    // Format date and time
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
    return dateString; // Return original if format doesn't match
  }

  const monthStr = dateMatch[2]; // "Dec"
  const dayStr = dateMatch[3]; // "10"
  const yearStr = dateMatch[4]; // "2025"

  // Convert month name to number
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

// Add 1 hour to a given time in HH:MM AM/PM format
// Input: time (e.g., "09:30 AM" or "11:45 PM")
// Output: time + 1 hour (e.g., "10:30 AM" or "12:45 AM")
export const addOneHourToTime = (time: string): string => {
  console.log("[addOneHourToTime] Input time:", time);

  try {
    if (!time) {
      console.log("[addOneHourToTime] Empty input");
      return "";
    }

    // Parse time string (supports formats like "09:30 AM" or "9:30 AM")
    const timeMatch = time.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
    if (!timeMatch) {
      throw new Error('Invalid time format. Expected "HH:MM AM/PM"');
    }

    let hours = parseInt(timeMatch[1], 10);
    const minutes = parseInt(timeMatch[2], 10);
    const ampm = timeMatch[3].toUpperCase();

    // Convert 12-hour to 24-hour format
    if (ampm === "PM" && hours < 12) hours += 12;
    if (ampm === "AM" && hours === 12) hours = 0;

    console.log(
      "[addOneHourToTime] Time in 24-hour format:",
      hours,
      ":",
      minutes
    );

    // Add 1 hour
    hours += 1;

    // Handle 24-hour wrapping (23:00 + 1 hour = 00:00, which is 12:00 AM next day)
    if (hours >= 24) {
      hours = 0;
    }

    console.log(
      "[addOneHourToTime] After adding 1 hour (24-hour):",
      hours,
      ":",
      minutes
    );

    // Convert back to 12-hour format
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

// XP and Leveling Configuration
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

// Matching Configuration
export const MATCHING_CONFIG = {
  minCompatibilityScore: 50,
  maxDistance: 50, // km
  mutualMatchChance: 0.3, // 30% chance for demo
};

// Workout Configuration
export const WORKOUT_CONFIG = {
  defaultDuration: 60, // minutes
  defaultCalories: 300,
  exerciseTypes: ["strength", "cardio", "flexibility", "mixed"],
  difficultyLevels: ["easy", "medium", "hard"],
};

// Training Types
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

// Gender Options
export const GENDER_OPTIONS = [
  "Male",
  "Female",
  "Non-binary",
  "Prefer not to say",
];

// Gender Preference Options (UI Display)
export const GENDER_PREFERENCE_OPTIONS = [
  "All",
  "Same Gender Only",
  "Opposite Gender Only",
];

// Training Schedule Options
export const TRAINING_SCHEDULE_OPTIONS = [
  "AM",
  "PM",
  "Flexible",
  "Weekends Only",
];

// Years Training Options
export const YEARS_TRAINING_OPTIONS = [
  "Less than 1 year",
  "1-2 years",
  "3-5 years",
  "5-10 years",
  "10+ years",
];

// Storage Keys
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

// Error Messages
export const ERROR_MESSAGES = {
  networkError: "Network error. Please check your connection.",
  authenticationError: "Authentication failed. Please try again.",
  locationError: "Location access is required to find nearby partners.",
  notificationError: "Notification permission is required for reminders.",
  generalError: "Something went wrong. Please try again.",
  validationError: "Please check your input and try again.",
};

// Success Messages
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

// Colors (for consistent theming)
export const COLORS = {
  primary: "#007AFF",
  secondary: "#5856D6",
  success: "#34C759",
  warning: "#FF9500",
  error: "#FF3B30",
  background: "#F2F2F7",
  surface: "#FFFFFF",
  text: "#000000",
  textSecondary: "#8E8E93",
  border: "#C6C6C8",
  card: "#FFFFFF",
  black: "#000000",
  _3A63ED: "#3A63ED",
  white: "#FFFFFF",
  placeholder: "#8E8E93",
  _191919: "#191919",
  _C9E3FF: "#C9E3FF",
  _383838: "#383838",
  _E6E6E6: "#E6E6E6",
  _DA9393: "#DA9393",
  border_dark: "#CDCDCD",
  app_black: "#151515",
  _BFDEFF: "#BFDEFF",
  _E5E7EB: "#E5E7EB",
  _109320: "#109320",
  _0DB312: "#0DB312",
  _5E5E5E: "#5E5E5E",
  _818181: "#818181",
  _999999: "#999999",
  _C9C9C9: "#C9C9C9",
  _FFC362: "#FFC362",
  _FFF5E9: "#FFF5E9",
  _B9780E: "#B9780E",
  gradient1: "#1B1F35",
  gradient2: "#222B68",
  gradient3: "#334691",
  _D9D9D9: "#D9D9D9",
  _FF1616: "#FF1616",
  _E2E2E2: "#E2E2E2",
  _222222: "#222222",
  _EB3434: "#EB3434",
  _E6E6E7: "#E6E6E7",
  _D7D7D7: "#D7D7D7",
  _EAEBF4: "#EAEBF4",
  _616888: "#616888",
  _595D66: "#595D66",
  _CCCCCC: "#CCCCCC",
  _D2E7FF: "#D2E7FF",
  _0B80FF: "#0B80FF",
  _3FE363: "#3FE363",
  _F3A455: "#F3A455",
  _2E6BDD: "#2E6BDD",
  // Added for SettingsScreen buttons
  buttonGrayBg: "rgba(223, 223, 223, 1)",
  buttonGrayText: "rgba(102, 102, 102, 1)",
  // Chat message background
  chatReceiverBg: "#9398F61F",
  // Chat screen colors
  chatMessageListBg: "#E4E4E466",
  chatDateSeparatorLine: "#0B123633",
  chatDateSeparatorText: "#051A5C9E",
};

// Dimensions
export const DIMENSIONS = {
  screenWidth: 375, // Default iPhone width
  screenHeight: 812, // Default iPhone height
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

// Animation Configuration
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
