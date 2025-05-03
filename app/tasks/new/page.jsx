"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import AuthLayout from "@/components/AuthLayout";
import TaskForm from "@/components/TaskForm";
import Link from "next/link";

export default function NewTask() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchUserAndTeam = async () => {
      try {
        // Fetch current user
        const userResponse = await axios.get("/api/auth/me");
        setUser(userResponse.data.user);

        // Fetch team members for assignment
        const teamResponse = await axios.get("/api/users");
        setTeamMembers(teamResponse.data.users);
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
        </div>

        {error && (
          <div className="rounded-md bg-red-50 p-4 mb-6">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">{error}</h3>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white shadow rounded-lg p-6">
          <TaskForm
            teamMembers={teamMembers}
            onSubmit={handleSubmit}
            isSubmitting={submitting}
          />
        </div>
      </div>
    </AuthLayout>
  );
}
