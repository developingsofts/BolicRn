import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type {
  BaseQueryFn,
  FetchArgs,
  FetchBaseQueryError,
} from "@reduxjs/toolkit/query";
import { API_CONFIG } from "../../config/constants";
import { storageService } from "../storage";

const baseQuery = fetchBaseQuery({
  baseUrl: API_CONFIG.baseUrl,
  prepareHeaders: async (headers, { endpoint }) => {
    const token = await storageService.getAuthToken();
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }

    const formDataEndpoints = [
      "updateMyProfileWithImage",
      "createPost",
      "updatePost",
      "sendMessage",
      "createConversation",
    ];
    if (!formDataEndpoints.includes(endpoint as string)) {
      if (!headers.has("Content-Type")) {
        headers.set("Content-Type", "application/json");
      }
    }

    return headers;
  },
});

const baseQueryWithErrorHandling: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  const url = typeof args === "string" ? args : args.url;
  const method = typeof args === "string" ? "GET" : args.method || "GET";
  const body = typeof args === "string" ? undefined : (args as FetchArgs).body;

 console.log("🌐 API Request:", {
  url: `${API_CONFIG.baseUrl}${url}`,
  method,
  body:
    body instanceof FormData
      ? (() => {
          const formDataEntries: Record<string, any> = {};
          body.forEach((value, key) => {
            formDataEntries[key] = value;
          });
          return {
            _type: "FormData",
            entries: formDataEntries,
          };
        })()
      : body
        ? typeof body === "string"
          ? body
          : JSON.stringify(body, null, 2)
        : undefined,
  timestamp: new Date().toISOString(),
});
  const startTime = Date.now();
  let result = await baseQuery(args, api, extraOptions);
  const coerceEmptyMembers404 = () => {
    if (!result || !("error" in result) || !result.error) {
      return null;
    }

    const error = result.error as FetchBaseQueryError & {
      data?:
        | { message?: string; status?: boolean; statusCode?: number }
        | string;
    };

    const errorData =
      error.data && typeof error.data === "object"
        ? (error.data as { code?: string })
        : null;
    // A private group's roster answers 403 GROUP_PRIVATE to non-members; like
    // the legacy 404, that renders as an empty list, not an error state (the
    // details screen shows its privacy notice instead).
    const isPrivateGroup =
      error.status === 403 && errorData?.code === "GROUP_PRIVATE";

    if (error.status !== 404 && !isPrivateGroup) {
      return null;
    }

    if (typeof url !== "string" || !url.includes("/group/members/")) {
      return null;
    }

    let page = 1;
    let limit = 20;

    try {
      const normalizedUrl = url.startsWith("http")
        ? url
        : `${API_CONFIG.baseUrl.replace(/\/$/, "")}${url}`;
      const parsed = new URL(normalizedUrl);
      const pageParam = parsed.searchParams.get("page");
      const limitParam = parsed.searchParams.get("limit");

      if (pageParam) {
        const parsedPage = Number(pageParam);
        if (!Number.isNaN(parsedPage)) {
          page = parsedPage;
        }
      }

      if (limitParam) {
        const parsedLimit = Number(limitParam);
        if (!Number.isNaN(parsedLimit)) {
          limit = parsedLimit;
        }
      }
    } catch (parseError) {
      console.warn(
        "Failed to parse members URL for pagination defaults",
        parseError,
      );
    }

    const message =
      typeof error.data === "string"
        ? error.data
        : error.data?.message || "No members found in this group";

    return {
      status: true,
      statusCode: 200,
      message,
      data: {
        members: [],
        pagination: {
          page,
          limit,
          total: 0,
          totalPages: 0,
          hasNextPage: false,
        },
      },
    };
  };

  const coercedMembersResponse = coerceEmptyMembers404();
  if (coercedMembersResponse) {
    result = { data: coercedMembersResponse } as typeof result;
  }

  // Same rule for a private group's posts: 403 GROUP_PRIVATE becomes an empty
  // feed so the details screen renders its privacy notice, not an error.
  if (
    result?.error &&
    (result.error as FetchBaseQueryError).status === 403 &&
    typeof url === "string" &&
    url.includes("/group/posts/") &&
    typeof (result.error as any).data === "object" &&
    (result.error as any).data?.code === "GROUP_PRIVATE"
  ) {
    result = {
      data: {
        status: true,
        statusCode: 200,
        message:
          (result.error as any).data?.message || "This group is private",
        data: {
          posts: [],
          pagination: {
            page: 1,
            limit: 10,
            total: 0,
            totalPages: 0,
            hasNextPage: false,
          },
        },
      },
    } as unknown as typeof result;
  }

  if (
    result?.error &&
    (result.error as FetchBaseQueryError).status === 404 &&
    typeof url === "string" &&
    url.includes("/workout-session/active")
  ) {
    result = {
      data: {
        status: true,
        message: "No active workout session found",
        statusCode: 200,
        data: null,
      },
    } as unknown as typeof result;
  }
  const duration = Date.now() - startTime;

  if (result.error) {
    console.error("❌ API Error:", {
      url: `${API_CONFIG.baseUrl}${url}`,
      method,
      status: result.error.status,
      error: result.error.data || result.error,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString(),
    });
  } else {
    console.log("✅ API Response:", {
      url: `${API_CONFIG.baseUrl}${url}`,
      method,
      data: result.data,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString(),
    });
  }

  const normalizeParsingError = () => {
    const error = result.error as FetchBaseQueryError & {
      originalStatus?: number;
      data?: unknown;
    };

    if (!error || error.status !== "PARSING_ERROR") {
      return null;
    }

    const fallbackStatus =
      typeof error.originalStatus === "number" ? error.originalStatus : 502;

    const rawPayload = typeof error.data === "string" ? error.data : null;

    return {
      status: fallbackStatus,
      data: {
        message:
          "The server response could not be parsed. Please verify the backend service is running and reachable.",
        code: "UPSTREAM_UNAVAILABLE",
        raw: rawPayload,
      },
    } satisfies FetchBaseQueryError;
  };

  const normalizedParsingError = normalizeParsingError();
  if (normalizedParsingError) {
    return { error: normalizedParsingError };
  }

  return result;
};

export const baseApi = createApi({
  reducerPath: "api",
  baseQuery: baseQueryWithErrorHandling,
  tagTypes: [
    "Auth",
    "User",
    "Workout",
    "Exercise",
    "WorkoutSession",
    "FindMain",
    "UserWorkout",
    "Matching",
    "Messaging",
    "Groups",
    "Posts",
    "Ratings",
    "Notifications",
    "TrainingTypes",
    "SelectedTrainingTypes",
    "Achievements",
    "Notes",
    "TrainerPricing",
    "TrainerAvailability",
    "TrainerSetup",
    "MyBookings",
    "ScheduledSessions",
    "BookTrainer",
    "SelectDateTime",
    "UserProfile",
    "Connections",
    "WeeklyGoal",
    "Activity",
  ],
  endpoints: () => ({}),
});

export type BaseApi = typeof baseApi;
