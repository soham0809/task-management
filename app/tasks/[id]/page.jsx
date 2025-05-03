"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import axios from "axios";
import { format } from "date-fns";
import AuthLayout from "@/components/AuthLayout";
import TaskForm from "@/components/TaskForm";
import Link from "next/link";

export default function TaskDetails() {
  const router = useRouter();
  const params = useParams();
  const taskId = params.id;

  const [user, setUser] = useState(null);
  const [task, setTask] = useState(null);
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch current user
        const userResponse = await axios.get("/api/auth/me");
        setUser(userResponse.data.user);

        // Fetch task details
        const taskResponse = await axios.get(`/api/tasks/${taskId}`);
        setTask(taskResponse.data.task);

        // Fetch team members for assignment
        const teamResponse = await axios.get("/api/users");
        setTeamMembers(teamResponse.data.users);
      } catch (error) {
        console.error("Error fetching data:", error);
        if (error.response?.status === 401) {
          router.push("/login");
        } else if (error.response?.status === 404) {
          // Handle task not found
          setError("Task not found");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router, taskId]);

  const handleUpdate = async (taskData) => {
    try {
      setSubmitting(true);
      setError("");

      const response = await axios.put(`/api/tasks/${taskId}`, taskData);

      if (response.data.success) {
        setTask(response.data.task);
        setIsEditing(false);
      }
    } catch (err) {
      console.error("Error updating task:", err);
      setError(
        err.response?.data?.message ||
          "Failed to update task. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    try {
      setDeleteLoading(true);
      setError("");

      const response = await axios.delete(`/api/tasks/${taskId}`);

      if (response.data.success) {
        router.push("/tasks");
      }
    } catch (err) {
      console.error("Error deleting task:", err);
      setError(
        err.response?.data?.message ||
          "Failed to delete task. Please try again."
      );
      setDeleteConfirm(false);
    } finally {
      setDeleteLoading(false);
    }
  };

  const canEdit = () => {
    if (!user || !task) return false;

    const isCreator = task.creator._id === user._id;
    const isAssignee = task.assignedTo && task.assignedTo._id === user._id;
    const isAdmin = user.role === "admin";

    return isCreator || isAssignee || isAdmin;
  };

  const canDelete = () => {
    if (!user || !task) return false;

    const isCreator = task.creator._id === user._id;
    const isAdmin = user.role === "admin";

    return isCreator || isAdmin;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-t-4 border-b-4 border-primary-600 rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-700">Loading task details...</p>
        </div>
      </div>
    );
  }

  if (error === "Task not found") {
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
            <h1 className="text-2xl font-bold text-gray-900">Task Not Found</h1>
          </div>

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
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <h3 className="mt-4 text-lg font-medium text-gray-900">
              Task not found
            </h3>
            <p className="mt-1 text-gray-500">
              The task you're looking for doesn't exist or has been deleted.
            </p>
            <div className="mt-6">
              <Link href="/tasks" className="btn btn-primary">
                Back to tasks
              </Link>
            </div>
          </div>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout user={user}>
      <div className="pb-12 max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
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
            <h1 className="text-2xl font-bold text-gray-900">
              {isEditing ? "Edit Task" : task?.title}
            </h1>
          </div>

          {!isEditing && canEdit() && (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="btn btn-secondary flex items-center"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-1"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                </svg>
                Edit
              </button>

              {canDelete() && (
                <button
                  type="button"
                  onClick={() => setDeleteConfirm(true)}
                  className="btn btn-danger flex items-center"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 mr-1"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Delete
                </button>
              )}
            </div>
          )}
        </div>

        {error && !isEditing && (
          <div className="rounded-md bg-red-50 p-4 mb-6">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">{error}</h3>
              </div>
            </div>
          </div>
        )}

        {isEditing ? (
          <div className="bg-white shadow rounded-lg p-6">
            {error && (
              <div className="rounded-md bg-red-50 p-4 mb-6">
                <div className="flex">
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">
                      {error}
                    </h3>
                  </div>
                </div>
              </div>
            )}

            <TaskForm
              task={task}
              teamMembers={teamMembers}
              onSubmit={handleUpdate}
              isSubmitting={submitting}
            />

            <div className="flex justify-end mt-4">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="btn btn-secondary mr-2"
                disabled={submitting}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="bg-white shadow rounded-lg overflow-hidden mb-6">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        task?.status === "completed"
                          ? "bg-green-100 text-green-800"
                          : task?.status === "in-progress"
                          ? "bg-blue-100 text-blue-800"
                          : task?.status === "review"
                          ? "bg-purple-100 text-purple-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {task?.status
                        .replace("-", " ")
                        .replace(/\b\w/g, (l) => l.toUpperCase())}
                    </span>

                    <span
                      className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        task?.priority === "high"
                          ? "bg-red-100 text-red-800"
                          : task?.priority === "medium"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-green-100 text-green-800"
                      }`}
                    >
                      {task?.priority.charAt(0).toUpperCase() +
                        task?.priority.slice(1)}{" "}
                      Priority
                    </span>
                  </div>

                  <div className="text-sm text-gray-500">
                    Created{" "}
                    {task && format(new Date(task.createdAt), "MMM d, yyyy")}
                  </div>
                </div>

                <div className="prose max-w-none mb-6">
                  <p className="text-gray-700 whitespace-pre-wrap">
                    {task?.description}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">
                      Due Date
                    </h3>
                    <p className="mt-1 text-sm text-gray-900">
                      {task && format(new Date(task.dueDate), "MMM d, yyyy")}
                    </p>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-500">
                      Completed Date
                    </h3>
                    <p className="mt-1 text-sm text-gray-900">
                      {task?.completedAt
                        ? format(new Date(task.completedAt), "MMM d, yyyy")
                        : "Not completed"}
                    </p>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-500">
                      Created By
                    </h3>
                    <p className="mt-1 text-sm text-gray-900">
                      {task?.creator.name}
                    </p>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-500">
                      Assigned To
                    </h3>
                    <p className="mt-1 text-sm text-gray-900">
                      {task?.assignedTo?.name || "Unassigned"}
                    </p>
                  </div>
                </div>

                {task?.isRecurring && (
                  <div className="mb-6">
                    <h3 className="text-sm font-medium text-gray-500">
                      Recurring Pattern
                    </h3>
                    <p className="mt-1 text-sm text-gray-900">
                      This task repeats {task.recurringPattern}
                    </p>
                  </div>
                )}

                {task?.tags && task.tags.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-2">
                      Tags
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {task.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="bg-gray-100 text-gray-800 px-2 py-0.5 rounded-full text-xs"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* Delete Confirmation Modal */}
        {deleteConfirm && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                Delete Task
              </h3>
              <p className="text-gray-700 mb-6">
                Are you sure you want to delete this task? This action cannot be
                undone.
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setDeleteConfirm(false)}
                  className="btn btn-secondary"
                  disabled={deleteLoading}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  className="btn btn-danger"
                  disabled={deleteLoading}
                >
                  {deleteLoading ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AuthLayout>
  );
}
