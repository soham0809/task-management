"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import axios from "axios";

export default function Navbar({ user }) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      // Count unread notifications
      const unread = user.notifications?.filter((n) => !n.read).length || 0;
      setUnreadNotifications(unread);
    }
  }, [user]);

  const handleLogout = async () => {
    try {
      setLoading(true);
      await axios.post("/api/auth/logout");
      router.push("/login");
      router.refresh();
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <nav className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/" className="text-xl font-bold text-primary-600">
                TaskFlow
              </Link>
            </div>
            {user && (
              <div className="hidden sm:ml-6 sm:flex sm:items-center sm:space-x-8">
                <Link
                  href="/dashboard"
                  className="text-gray-700 hover:text-primary-600 px-3 py-2 text-sm font-medium"
                >
                  Dashboard
                </Link>
                <Link
                  href="/tasks"
                  className="text-gray-700 hover:text-primary-600 px-3 py-2 text-sm font-medium"
                >
                  Tasks
                </Link>
                <Link
                  href="/teams"
                  className="text-gray-700 hover:text-primary-600 px-3 py-2 text-sm font-medium"
                >
                  Team
                </Link>
                {user.role === "admin" && (
                  <Link
                    href="/admin"
                    className="text-gray-700 hover:text-primary-600 px-3 py-2 text-sm font-medium"
                  >
                    Admin
                  </Link>
                )}
              </div>
            )}
          </div>
          <div className="hidden sm:ml-6 sm:flex sm:items-center">
            {user ? (
              <>
                <Link
                  href="/notifications"
                  className="relative p-2 text-gray-600 hover:text-primary-600"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6"
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
                  {unreadNotifications > 0 && (
                    <span className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-xs">
                      {unreadNotifications}
                    </span>
                  )}
                </Link>

                <div className="ml-3 relative">
                  <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="flex items-center max-w-xs rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  >
                    <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-medium">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                  </button>

                  {isOpen && (
                    <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 z-50">
                      <Link
                        href="/profile"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setIsOpen(false)}
                      >
                        Your Profile
                      </Link>
                      <Link
                        href="/settings"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setIsOpen(false)}
                      >
                        Settings
                      </Link>
                      <button
                        onClick={handleLogout}
                        disabled={loading}
                        className="w-full text-left block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        {loading ? "Logging out..." : "Sign out"}
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-4">
                <Link
                  href="/login"
                  className="text-gray-700 hover:text-primary-600 px-3 py-2 text-sm font-medium"
                >
                  Log in
                </Link>
                <Link href="/register" className="btn btn-primary">
                  Sign up
                </Link>
              </div>
            )}
          </div>

          <div className="-mr-2 flex items-center sm:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500"
            >
              <span className="sr-only">Open main menu</span>
              <svg
                className={`${isOpen ? "hidden" : "block"} h-6 w-6`}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
              <svg
                className={`${isOpen ? "block" : "hidden"} h-6 w-6`}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div className={`${isOpen ? "block" : "hidden"} sm:hidden`}>
        <div className="pt-2 pb-3 space-y-1">
          {user ? (
            <>
              <Link
                href="/dashboard"
                className="block pl-3 pr-4 py-2 text-base font-medium text-gray-700 hover:bg-gray-50 hover:text-primary-600"
                onClick={() => setIsOpen(false)}
              >
                Dashboard
              </Link>
              <Link
                href="/tasks"
                className="block pl-3 pr-4 py-2 text-base font-medium text-gray-700 hover:bg-gray-50 hover:text-primary-600"
                onClick={() => setIsOpen(false)}
              >
                Tasks
              </Link>
              <Link
                href="/teams"
                className="block pl-3 pr-4 py-2 text-base font-medium text-gray-700 hover:bg-gray-50 hover:text-primary-600"
                onClick={() => setIsOpen(false)}
              >
                Team
              </Link>
              {user.role === "admin" && (
                <Link
                  href="/admin"
                  className="block pl-3 pr-4 py-2 text-base font-medium text-gray-700 hover:bg-gray-50 hover:text-primary-600"
                  onClick={() => setIsOpen(false)}
                >
                  Admin
                </Link>
              )}
              <Link
                href="/profile"
                className="block pl-3 pr-4 py-2 text-base font-medium text-gray-700 hover:bg-gray-50 hover:text-primary-600"
                onClick={() => setIsOpen(false)}
              >
                Your Profile
              </Link>
              <Link
                href="/settings"
                className="block pl-3 pr-4 py-2 text-base font-medium text-gray-700 hover:bg-gray-50 hover:text-primary-600"
                onClick={() => setIsOpen(false)}
              >
                Settings
              </Link>
              <Link
                href="/notifications"
                className="block pl-3 pr-4 py-2 text-base font-medium text-gray-700 hover:bg-gray-50 hover:text-primary-600"
                onClick={() => setIsOpen(false)}
              >
                Notifications{" "}
                {unreadNotifications > 0 && `(${unreadNotifications})`}
              </Link>
              <button
                onClick={handleLogout}
                disabled={loading}
                className="w-full text-left block pl-3 pr-4 py-2 text-base font-medium text-gray-700 hover:bg-gray-50 hover:text-primary-600"
              >
                {loading ? "Logging out..." : "Sign out"}
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="block pl-3 pr-4 py-2 text-base font-medium text-gray-700 hover:bg-gray-50 hover:text-primary-600"
                onClick={() => setIsOpen(false)}
              >
                Log in
              </Link>
              <Link
                href="/register"
                className="block pl-3 pr-4 py-2 text-base font-medium text-primary-600 hover:bg-gray-50"
                onClick={() => setIsOpen(false)}
              >
                Sign up
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
