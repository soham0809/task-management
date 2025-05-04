"use client";

import { useState, useEffect, useMemo } from "react";
import axios from "axios";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format, isAfter } from "date-fns";
import AuthLayout from "@/components/AuthLayout";
import TaskCard from "@/components/TaskCard";

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState([]);
  const [stats, setStats] = useState({
    totalTasks: 0,
    completedTasks: 0,
    overdueTasks: 0,
    tasksDueToday: 0,
  });
  const [userTeam, setUserTeam] = useState(null);

  useEffect(() => {
    const fetchUserAndTasks = async () => {
      try {
        // Fetch current user
        const userResponse = await axios.get("/api/auth/me");
        const userData = userResponse.data.user;
        setUser(userData);

        // Check if user has a team and fetch it
        if (userData.team) {
          try {
            // Use String constructor to ensure teamId is treated as a string
            const teamResponse = await axios.get(
              `/api/teams/${String(userData.team)}`
            );
            if (teamResponse.data.success) {
              setUserTeam(teamResponse.data.team);
            } else {
              // If team fetch fails with a success:false response
              console.error(
                "Team fetch returned an error:",
                teamResponse.data.message
              );
              setUserTeam(null);
            }
          } catch (teamError) {
            console.error("Error fetching team:", teamError);
            // Reset team reference if team doesn't exist or there's an error
            if (teamError.response?.status === 404) {
              // Team not found, clear the state
              setUserTeam(null);

              // Update user record to clear team reference
              try {
                await axios.patch("/api/auth/me", { team: null });
                // Refresh user data
                const updatedUserResponse = await axios.get("/api/auth/me");
                setUser(updatedUserResponse.data.user);
              } catch (updateError) {
                console.error("Error updating user record:", updateError);
              }
            }
          }
        } else {
          // No team associated with user
          setUserTeam(null);
        }

        // Fetch user's tasks (assigned to them and created by them)
        const tasksResponse = await axios.get("/api/tasks?limit=50");
        setTasks(tasksResponse.data.tasks);

        // Calculate dashboard stats
        const allTasks = tasksResponse.data.tasks;
        const now = new Date();

        const totalTasks = allTasks.length;
        const completedTasks = allTasks.filter(
          (task) => task.status === "completed"
        ).length;

        const overdueTasks = allTasks.filter((task) => {
          const dueDate = new Date(task.dueDate);
          return isAfter(now, dueDate) && task.status !== "completed";
        }).length;

        const tasksDueToday = allTasks.filter((task) => {
          const dueDate = new Date(task.dueDate);
          return (
            format(dueDate, "yyyy-MM-dd") === format(now, "yyyy-MM-dd") &&
            task.status !== "completed"
          );
        }).length;

        setStats({
          totalTasks,
          completedTasks,
          overdueTasks,
          tasksDueToday,
        });
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        if (error.response?.status === 401) {
          router.push("/login");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUserAndTasks();
  }, [router]);

  // Get tasks assigned to the user
  const assignedTasks = useMemo(() => {
    if (!user || !tasks.length) return [];
    return tasks
      .filter(
        (task) =>
          task.assignedTo?._id === user._id && task.status !== "completed"
      )
      .slice(0, 5);
  }, [user, tasks]);

  // Get tasks created by the user
  const createdTasks = useMemo(() => {
    if (!user || !tasks.length) return [];
    return tasks.filter((task) => task.creator?._id === user._id).slice(0, 5);
  }, [user, tasks]);

  // Get overdue tasks
  const overdueTasks = useMemo(() => {
    if (!tasks.length) return [];
    const now = new Date();
    return tasks
      .filter((task) => {
        const dueDate = new Date(task.dueDate);
        return isAfter(now, dueDate) && task.status !== "completed";
      })
      .slice(0, 5);
  }, [tasks]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-t-4 border-b-4 border-primary-600 rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-700">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <AuthLayout user={user}>
      <div className="pb-12">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>

        {/* Team Warning */}
        {!user?.team && (
          <div className="mb-8 bg-yellow-50 border-l-4 border-yellow-400 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-yellow-400"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  You are not currently part of any team. To create or assign
                  tasks, you need to join or create a team.
                </p>
                <div className="mt-2">
                  <Link
                    href="/team"
                    className="text-sm font-medium text-yellow-700 hover:text-yellow-600"
                  >
                    Go to team page →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Team Info */}
        {userTeam && (
          <div className="mb-8 bg-white shadow rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-medium text-gray-900">Your Team</h2>
                <p className="text-xl font-semibold text-primary-600 mt-1">
                  {userTeam.name}
                </p>
                {userTeam.description && (
                  <p className="text-sm text-gray-500 mt-1">
                    {userTeam.description}
                  </p>
                )}
              </div>
              <Link
                href="/team"
                className="bg-primary-50 text-primary-700 px-4 py-2 rounded hover:bg-primary-100"
              >
                View Team
              </Link>
            </div>
          </div>
        )}

        {/* Stats Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="bg-primary-100 p-3 rounded-full">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 text-primary-600"
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
              </div>
              <div className="ml-4">
                <h2 className="text-lg font-semibold text-gray-700">
                  Total Tasks
                </h2>
                <p className="text-3xl font-bold text-gray-900">
                  {stats.totalTasks}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="bg-green-100 p-3 rounded-full">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 text-green-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <div className="ml-4">
                <h2 className="text-lg font-semibold text-gray-700">
                  Completed
                </h2>
                <p className="text-3xl font-bold text-gray-900">
                  {stats.completedTasks}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="bg-red-100 p-3 rounded-full">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 text-red-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div className="ml-4">
                <h2 className="text-lg font-semibold text-gray-700">Overdue</h2>
                <p className="text-3xl font-bold text-gray-900">
                  {stats.overdueTasks}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="bg-yellow-100 p-3 rounded-full">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 text-yellow-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <div className="ml-4">
                <h2 className="text-lg font-semibold text-gray-700">
                  Due Today
                </h2>
                <p className="text-3xl font-bold text-gray-900">
                  {stats.tasksDueToday}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow mb-8 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Quick Actions
          </h2>
          <div className="flex flex-wrap gap-4">
            <Link
              href="/tasks/new"
              className="btn btn-primary flex items-center"
            >
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
              Create New Task
            </Link>

            <Link href="/tasks" className="btn btn-secondary flex items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-2"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" />
              </svg>
              View All Tasks
            </Link>

            <Link href="/team" className="btn btn-secondary flex items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-2"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
              </svg>
              Team Members
            </Link>
          </div>
        </div>

        {/* Task Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Assigned Tasks */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Assigned to Me
              </h2>
              <Link
                href="/tasks/assigned"
                className="text-primary-600 hover:text-primary-800 text-sm font-medium"
              >
                View all
              </Link>
            </div>

            <div className="space-y-4">
              {assignedTasks.length > 0 ? (
                assignedTasks.map((task) => (
                  <TaskCard key={task._id} task={task} />
                ))
              ) : (
                <p className="text-gray-500 text-center py-6">
                  No tasks assigned to you
                </p>
              )}
            </div>
          </div>

          {/* Created Tasks */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900">My Tasks</h2>
              <Link
                href="/tasks/my-tasks"
                className="text-primary-600 hover:text-primary-800 text-sm font-medium"
              >
                View all
              </Link>
            </div>

            <div className="space-y-4">
              {createdTasks.length > 0 ? (
                createdTasks.map((task) => (
                  <TaskCard key={task._id} task={task} />
                ))
              ) : (
                <p className="text-gray-500 text-center py-6">
                  You haven't created any tasks yet
                </p>
              )}
            </div>
          </div>

          {/* Overdue Tasks */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Overdue Tasks
              </h2>
              <Link
                href="/tasks?dueDate=overdue"
                className="text-primary-600 hover:text-primary-800 text-sm font-medium"
              >
                View all
              </Link>
            </div>

            <div className="space-y-4">
              {overdueTasks.length > 0 ? (
                overdueTasks.map((task) => (
                  <TaskCard key={task._id} task={task} />
                ))
              ) : (
                <p className="text-gray-500 text-center py-6">
                  No overdue tasks
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </AuthLayout>
  );
}
