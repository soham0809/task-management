"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import axios from "axios";
import AuthLayout from "@/components/AuthLayout";
import TaskCard from "@/components/TaskCard";
import TaskFilters from "@/components/TaskFilters";
import Link from "next/link";
import { useRouter } from "next/navigation";

// Separate component that uses useSearchParams
function TasksContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [user, setUser] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 1,
  });

  // Get current page from URL or default to 1
  const page = parseInt(searchParams.get("page") || "1");

  useEffect(() => {
    const fetchUserAndTasks = async () => {
      try {
        // Fetch current user
        const userResponse = await axios.get("/api/auth/me");
        setUser(userResponse.data.user);

        // Build query params from search params
        const params = new URLSearchParams(searchParams);
        if (!params.has("page")) {
          params.set("page", page.toString());
        }
        if (!params.has("limit")) {
          params.set("limit", "10");
        }

        // Fetch tasks with filters
        const tasksResponse = await axios.get(
          `/api/tasks?${params.toString()}`
        );
        setTasks(tasksResponse.data.tasks);
        setPagination(tasksResponse.data.pagination);
      } catch (error) {
        console.error("Error fetching tasks:", error);
        if (error.response?.status === 401) {
          router.push("/login");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUserAndTasks();
  }, [router, searchParams, page]);

  // Handle pagination
  const handlePageChange = (newPage) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", newPage.toString());
    router.push(`/tasks?${params.toString()}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-t-4 border-b-4 border-primary-600 rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-700">Loading tasks...</p>
        </div>
      </div>
    );
  }

  return (
    <AuthLayout user={user}>
      <div className="pb-12">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Tasks</h1>
          <Link href="/tasks/new" className="btn btn-primary flex items-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 mr-2"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"
                clipRule="evenodd"
              />
            </svg>
            Create Task
          </Link>
        </div>

        {/* Filters */}
        <TaskFilters />

        {/* Task List */}
        {tasks.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {tasks.map((task) => (
              <TaskCard key={task._id} task={task} />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow p-8 text-center">
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
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
            <h3 className="mt-4 text-lg font-medium text-gray-900">
              No tasks found
            </h3>
            <p className="mt-1 text-gray-500">
              Try changing your filters or create a new task.
            </p>
            <div className="mt-6">
              <Link href="/tasks/new" className="btn btn-primary">
                Create your first task
              </Link>
            </div>
          </div>
        )}

        {/* Pagination */}
        {tasks.length > 0 && pagination.pages > 1 && (
          <div className="flex justify-center mt-8">
            <nav
              className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px"
              aria-label="Pagination"
            >
              <button
                onClick={() => handlePageChange(page - 1)}
                disabled={page === 1}
                className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${
                  page === 1
                    ? "text-gray-300 cursor-not-allowed"
                    : "text-gray-500 hover:bg-gray-50"
                }`}
              >
                <span className="sr-only">Previous</span>
                <svg
                  className="h-5 w-5"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>

              {/* Page Numbers */}
              {[...Array(pagination.pages).keys()].map((pageNum) => {
                const pageNumber = pageNum + 1;
                const isCurrentPage = pageNumber === page;

                // Show limited page numbers to avoid clutter
                if (
                  pageNumber === 1 ||
                  pageNumber === pagination.pages ||
                  (pageNumber >= page - 1 && pageNumber <= page + 1)
                ) {
                  return (
                    <button
                      key={pageNumber}
                      onClick={() => handlePageChange(pageNumber)}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                        isCurrentPage
                          ? "z-10 bg-primary-50 border-primary-500 text-primary-600"
                          : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
                      }`}
                    >
                      {pageNumber}
                    </button>
                  );
                }

                // Add ellipsis
                if (
                  (pageNumber === 2 && page > 3) ||
                  (pageNumber === pagination.pages - 1 &&
                    page < pagination.pages - 2)
                ) {
                  return (
                    <span
                      key={pageNumber}
                      className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700"
                    >
                      ...
                    </span>
                  );
                }

                return null;
              })}

              <button
                onClick={() => handlePageChange(page + 1)}
                disabled={page === pagination.pages}
                className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${
                  page === pagination.pages
                    ? "text-gray-300 cursor-not-allowed"
                    : "text-gray-500 hover:bg-gray-50"
                }`}
              >
                <span className="sr-only">Next</span>
                <svg
                  className="h-5 w-5"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </nav>
          </div>
        )}
      </div>
    </AuthLayout>
  );
}

// Loading fallback for Suspense
function TasksLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-t-4 border-b-4 border-primary-600 rounded-full animate-spin mx-auto"></div>
        <p className="mt-4 text-gray-700">Loading tasks...</p>
      </div>
    </div>
  );
}

// Main component wrapped with Suspense
export default function Tasks() {
  return (
    <Suspense fallback={<TasksLoading />}>
      <TasksContent />
    </Suspense>
  );
}
