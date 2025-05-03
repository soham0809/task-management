"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { format } from "date-fns";
import AuthLayout from "@/components/AuthLayout";
import Link from "next/link";

export default function Notifications() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [markingAsRead, setMarkingAsRead] = useState(false);

  useEffect(() => {
    const fetchUserAndNotifications = async () => {
      try {
        // Fetch current user
        const userResponse = await axios.get("/api/auth/me");
        setUser(userResponse.data.user);

        // Fetch notifications
        const notificationsResponse = await axios.get("/api/notifications");
        setNotifications(notificationsResponse.data.notifications);
      } catch (error) {
        console.error("Error fetching notifications:", error);
        if (error.response?.status === 401) {
          router.push("/login");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUserAndNotifications();
  }, [router]);

  // Mark all notifications as read
  const markAllAsRead = async () => {
    try {
      setMarkingAsRead(true);

      // Get IDs of unread notifications
      const unreadIds = notifications
        .filter((notification) => !notification.read)
        .map((notification) => notification._id);

      if (unreadIds.length === 0) return;

      // Update in the API
      await axios.post("/api/notifications", { notificationIds: unreadIds });

      // Update locally
      const updatedNotifications = notifications.map((notification) => ({
        ...notification,
        read: true,
      }));

      setNotifications(updatedNotifications);

      // Also update the user object
      if (user) {
        setUser({
          ...user,
          notifications: updatedNotifications,
        });
      }
    } catch (error) {
      console.error("Error marking notifications as read:", error);
    } finally {
      setMarkingAsRead(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-t-4 border-b-4 border-primary-600 rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-700">Loading notifications...</p>
        </div>
      </div>
    );
  }

  return (
    <AuthLayout user={user}>
      <div className="pb-12 max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>

          {notifications.some((notification) => !notification.read) && (
            <button
              onClick={markAllAsRead}
              disabled={markingAsRead}
              className="btn btn-secondary text-sm"
            >
              {markingAsRead ? "Marking..." : "Mark all as read"}
            </button>
          )}
        </div>

        {notifications.length > 0 ? (
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <ul className="divide-y divide-gray-200">
              {notifications.map((notification) => (
                <li
                  key={notification._id}
                  className={`p-4 hover:bg-gray-50 ${
                    !notification.read ? "bg-blue-50" : ""
                  }`}
                >
                  <Link
                    href={
                      notification.taskId
                        ? `/tasks/${notification.taskId}`
                        : "#"
                    }
                    className="block"
                  >
                    <div className="flex items-start">
                      <div
                        className={`flex-shrink-0 h-8 w-8 rounded-full ${
                          notification.read ? "bg-gray-200" : "bg-primary-100"
                        } flex items-center justify-center`}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className={`h-5 w-5 ${
                            notification.read
                              ? "text-gray-500"
                              : "text-primary-600"
                          }`}
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
                        </svg>
                      </div>
                      <div className="ml-3 flex-1">
                        <p
                          className={`text-sm ${
                            notification.read
                              ? "text-gray-500"
                              : "text-gray-900 font-medium"
                          }`}
                        >
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {notification.createdAt &&
                            format(
                              new Date(notification.createdAt),
                              "MMM d, yyyy h:mm a"
                            )}
                        </p>
                      </div>
                      {!notification.read && (
                        <div className="ml-2 flex-shrink-0">
                          <span className="inline-block h-2 w-2 rounded-full bg-primary-600"></span>
                        </div>
                      )}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="bg-white shadow rounded-lg p-8 text-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-12 w-12 mx-auto text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
              />
            </svg>
            <h3 className="mt-4 text-lg font-medium text-gray-900">
              No notifications
            </h3>
            <p className="mt-1 text-gray-500">
              You don't have any notifications yet.
            </p>
          </div>
        )}
      </div>
    </AuthLayout>
  );
}
