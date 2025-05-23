"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import axios from "axios";
import AuthLayout from "@/components/AuthLayout";
import TaskForm from "@/components/TaskForm";
import Link from "next/link";

// Create a separate component that uses searchParams
function NewTaskContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const assignToId = searchParams.get("assignTo");

  const [user, setUser] = useState(null);
  const [teamMembers, setTeamMembers] = useState([]);
  const [userTeam, setUserTeam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchUserAndTeam = async () => {
      try {
        // Fetch current user
        const userResponse = await axios.get("/api/auth/me");
        setUser(userResponse.data.user);

        // Check if user is in a team
        if (!userResponse.data.user.team) {
          setError(
            "You must be part of a team to create tasks. Please join or create a team first."
          );
          setLoading(false);
          return;
        }

        // Fetch team members from user's team
        const teamResponse = await axios.get(
          `/api/teams/${userResponse.data.user.team}`
        );
        setUserTeam(teamResponse.data.team);
        setTeamMembers(teamResponse.data.members);
      } catch (error) {
        console.error("Error fetching data:", error);
        if (error.response?.status === 401) {
          router.push("/login");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUserAndTeam();
  }, [router]);

  const handleSubmit = async (taskData) => {
    try {
      setSubmitting(true);
      setError("");

      const response = await axios.post("/api/tasks", taskData);

      if (response.data.success) {
        router.push(`/tasks/${response.data.task._id}`);
      }
    } catch (err) {
      console.error("Error creating task:", err);
      setError(
        err.response?.data?.message ||
          "Failed to create task. Please try again."
      );
    } finally {
      setSubmitting(false);
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
      <div className="pb-12 max-w-4xl mx-auto">
        <div className="flex items-center mb-6">
          <Link
            href="/tasks"
            className="mr-4 text-gray-500 hover:text-gray-700"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Create New Task</h1>
          {userTeam && (
            <span className="ml-4 text-sm text-gray-500">
              Team: {userTeam.name}
            </span>
          )}
        </div>

        {error && (
          <div className="rounded-md bg-red-50 p-4 mb-6">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">{error}</h3>
                {!user?.team && (
                  <div className="mt-2">
                    <Link
                      href="/team"
                      className="text-sm font-medium text-primary-600 hover:text-primary-500"
                    >
                      Go to team page to join or create a team
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {user?.team ? (
          <div className="bg-white shadow rounded-lg p-6">
            <TaskForm
              teamMembers={teamMembers}
              onSubmit={handleSubmit}
              isSubmitting={submitting}
              initialAssignedTo={assignToId}
            />
          </div>
        ) : (
          <div className="bg-white shadow rounded-lg p-6 text-center">
            <p className="text-gray-700 mb-4">
              You need to be part of a team to create and assign tasks.
            </p>
            <Link
              href="/team"
              className="inline-block bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-4 rounded"
            >
              Join or Create a Team
            </Link>
          </div>
        )}
      </div>
    </AuthLayout>
  );
}

// Loader component for Suspense fallback
function NewTaskLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-t-4 border-b-4 border-primary-600 rounded-full animate-spin mx-auto"></div>
        <p className="mt-4 text-gray-700">Loading...</p>
      </div>
    </div>
  );
}

// Main component with Suspense boundary
export default function NewTask() {
  return (
    <Suspense fallback={<NewTaskLoader />}>
      <NewTaskContent />
    </Suspense>
  );
}
