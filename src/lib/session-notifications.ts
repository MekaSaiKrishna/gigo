import type { Session } from "../types";
import { formatDuration } from "../utils/date-format";

type NotificationsModule = {
  AndroidImportance?: { LOW?: number; DEFAULT?: number };
  setNotificationChannelAsync?: (...args: any[]) => Promise<any>;
  setNotificationCategoryAsync: (...args: any[]) => Promise<any>;
  scheduleNotificationAsync: (...args: any[]) => Promise<string>;
  cancelScheduledNotificationAsync: (id: string) => Promise<void>;
  dismissNotificationAsync?: (id: string) => Promise<void>;
  getPermissionsAsync?: () => Promise<{ status?: string; granted?: boolean }>;
  requestPermissionsAsync?: () => Promise<{ status?: string; granted?: boolean }>;
  setNotificationHandler?: (handler: unknown) => void;
};

let notificationsModule: NotificationsModule | null = null;

try {
  // Optional dependency at runtime. If not installed, banner still works in-app.
  notificationsModule = require("expo-notifications");
} catch {
  notificationsModule = null;
}

const RUNNING_CATEGORY = "session_running";
const PAUSED_CATEGORY = "session_paused";
const ENDED_CATEGORY = "session_ended";
export const NOTIF_ACTION_PAUSE = "pause_session";
export const NOTIF_ACTION_PLAY = "play_session";
export const NOTIF_ACTION_END = "end_session";

let configured = false;
let activeNotificationId: string | null = null;
let lastNotificationKey: string | null = null;
let notificationsEnabled = false;

export function areSessionNotificationsAvailable(): boolean {
  return Boolean(notificationsModule);
}

export async function configureSessionNotifications(): Promise<void> {
  if (!notificationsModule || configured) return;
  configured = true;

  const permission = notificationsModule.getPermissionsAsync
    ? await notificationsModule.getPermissionsAsync()
    : { granted: true };
  if (!permission.granted && notificationsModule.requestPermissionsAsync) {
    const requested = await notificationsModule.requestPermissionsAsync();
    notificationsEnabled = Boolean(requested.granted || requested.status === "granted");
  } else {
    notificationsEnabled = Boolean(permission.granted || permission.status === "granted");
  }

  if (!notificationsEnabled) {
    return;
  }

  notificationsModule.setNotificationHandler?.({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });

  await notificationsModule.setNotificationCategoryAsync(RUNNING_CATEGORY, [
    { identifier: NOTIF_ACTION_PAUSE, buttonTitle: "Pause" },
    { identifier: NOTIF_ACTION_END, buttonTitle: "End", options: { isDestructive: true } },
  ]);

  await notificationsModule.setNotificationCategoryAsync(PAUSED_CATEGORY, [
    { identifier: NOTIF_ACTION_PLAY, buttonTitle: "Play" },
    { identifier: NOTIF_ACTION_END, buttonTitle: "End", options: { isDestructive: true } },
  ]);

  await notificationsModule.setNotificationCategoryAsync(ENDED_CATEGORY, []);

  await notificationsModule.setNotificationChannelAsync?.("session", {
    name: "Active Session",
    importance: notificationsModule.AndroidImportance?.DEFAULT ?? 3,
  });
}

export async function syncSessionNotification(session: Session | null): Promise<void> {
  if (!notificationsModule) return;
  await configureSessionNotifications();
  if (!notificationsEnabled) return;

  if (!session) {
    if (activeNotificationId) {
      await notificationsModule.dismissNotificationAsync?.(activeNotificationId);
      await notificationsModule.cancelScheduledNotificationAsync(activeNotificationId);
    }
    activeNotificationId = null;
    lastNotificationKey = null;
    return;
  }

  const elapsed = Math.max(0, Math.floor(session.elapsed_time));
  // Keep exactly one active notification. Only re-publish on state transitions.
  const key = `${session.id}:${session.is_paused ? 1 : 0}`;
  if (key === lastNotificationKey) return;

  if (activeNotificationId) {
    await notificationsModule.dismissNotificationAsync?.(activeNotificationId);
    await notificationsModule.cancelScheduledNotificationAsync(activeNotificationId);
    activeNotificationId = null;
  }

  const title = session.display_name ?? "Workout Session";
  const body = `${session.is_paused ? "Paused" : "Running"} • ${formatDuration(elapsed)}`;
  activeNotificationId = await notificationsModule.scheduleNotificationAsync({
    content: {
      title,
      body,
      data: { sessionId: session.id },
      categoryIdentifier: session.is_paused ? PAUSED_CATEGORY : RUNNING_CATEGORY,
      sound: false,
      sticky: true,
    },
    trigger: null,
  });
  lastNotificationKey = key;
}

export async function notifySessionEnded(workoutName: string): Promise<void> {
  if (!notificationsModule) return;
  await configureSessionNotifications();
  if (!notificationsEnabled) return;

  if (activeNotificationId) {
    await notificationsModule.dismissNotificationAsync?.(activeNotificationId);
    await notificationsModule.cancelScheduledNotificationAsync(activeNotificationId);
    activeNotificationId = null;
  }
  lastNotificationKey = null;

  await notificationsModule.scheduleNotificationAsync({
    content: {
      title: "Session Complete",
      body: `Kudos! Your '${workoutName}' has ended`,
      data: { target: "home" },
      categoryIdentifier: ENDED_CATEGORY,
      sound: false,
    },
    trigger: null,
  });
}

export function getNotificationActions() {
  return {
    pause: NOTIF_ACTION_PAUSE,
    play: NOTIF_ACTION_PLAY,
    end: NOTIF_ACTION_END,
  } as const;
}
