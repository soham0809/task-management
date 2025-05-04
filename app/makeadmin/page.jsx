"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import AuthLayout from "@/components/AuthLayout";

export default function MakeAdmin() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await axios.get("/api/auth/me");
        setUser(response.data.user);
        setIsAdmin(response.data.user.role === "admin");
      } catch (error) {
        console.error("Error fetching user:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  const handleMakeAdmin = async () => {
    try {
      setProcessing(true);
      setMessage("");

      const response = await axios.post("/api/admin/makeadmin");

      if (response.data.success) {
        setIsAdmin(true);
        setMessage(
          "Success! You are now an admin. The Admin Panel should now be visible in the sidebar."
        );
      }
    } catch (error) {
      setMessage(
        `Error: ${error.response?.data?.message || "Failed to make admin"}`
      );
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-t-4 border-b-4 border-primary-600 rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-700">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <AuthLayout user={user}>
      <div className="py-8">
        <div className="max-w-md mx-auto bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">
              Admin Access Tool
            </h2>

            {isAdmin ? (
              <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-6">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg
                      className="h-5 w-5 text-green-400"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-green-700">
                      You already have admin privileges. You should see the
                      Admin Panel in the sidebar.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <p className="text-gray-600 mb-6">
                  Click the button below to give yourself admin privileges. This
                  will allow you to access the Admin Panel from the sidebar.
                </p>
                <button
                  onClick={handleMakeAdmin}
                  disabled={processing}
                  className="w-full bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                >
                  {processing ? "Processing..." : "Make Me Admin"}
                </button>
              </>
            )}

            {message && (
              <div
                className={`mt-4 p-3 border rounded-md ${
                  isAdmin
                    ? "bg-green-50 border-green-200 text-green-700"
                    : "bg-red-50 border-red-200 text-red-700"
                }`}
              >
                {message}
              </div>
            )}

            <div className="mt-6">
              <h3 className="text-lg font-medium text-gray-800 mb-2">
                Next steps:
              </h3>
              <ol className="list-decimal pl-5 text-gray-600 space-y-2">
                <li>
                  After becoming an admin, the "Admin Panel" link should appear
                  in the sidebar.
                </li>
                <li>
                  Click on the "Admin Panel" link to access the admin dashboard.
                </li>
                <li>
                  If the link does not appear, try refreshing the page after
                  becoming an admin.
                </li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </AuthLayout>
  );
}
