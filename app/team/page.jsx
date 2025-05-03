"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import AuthLayout from "@/components/AuthLayout";

export default function Team() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchUserAndTeam = async () => {
      try {
        // Fetch current user
        const userResponse = await axios.get("/api/auth/me");
        setUser(userResponse.data.user);

        // Fetch team members
        const teamResponse = await axios.get("/api/users");
        setTeamMembers(teamResponse.data.users);
      } catch (error) {
        console.error("Error fetching team data:", error);
        if (error.response?.status === 401) {
          router.push("/login");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUserAndTeam();
  }, [router]);

  // Filter team members by search query
  const filteredTeamMembers = teamMembers.filter((member) => {
    if (!searchQuery) return true;

    const query = searchQuery.toLowerCase();
    return (
      member.name.toLowerCase().includes(query) ||
      member.email.toLowerCase().includes(query) ||
      member.role.toLowerCase().includes(query)
    );
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-t-4 border-b-4 border-primary-600 rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-700">Loading team members...</p>
        </div>
      </div>
    );
  }

  return (
    <AuthLayout user={user}>
      <div className="pb-12">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Team Members</h1>

        {/* Search */}
        <div className="mb-6">
          <div className="relative rounded-md shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg
                className="h-5 w-5 text-gray-400"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <input
              type="text"
              className="focus:ring-primary-500 focus:border-primary-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md p-2"
              placeholder="Search team members..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Team Members List */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="min-w-full divide-y divide-gray-200">
            <div className="bg-gray-50">
              <div className="grid grid-cols-12 gap-3 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <div className="col-span-3 sm:col-span-4">Name</div>
                <div className="col-span-5 sm:col-span-4">Email</div>
                <div className="col-span-2 hidden sm:block">Role</div>
                <div className="col-span-4 sm:col-span-2 text-right">
                  Actions
                </div>
              </div>
            </div>
            <div className="bg-white divide-y divide-gray-200">
              {filteredTeamMembers.length > 0 ? (
                filteredTeamMembers.map((member) => (
                  <div
                    key={member._id}
                    className="grid grid-cols-12 gap-3 px-6 py-4 hover:bg-gray-50"
                  >
                    <div className="col-span-3 sm:col-span-4 flex items-center">
                      <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-medium mr-3">
                        {member.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="font-medium text-gray-900 truncate">
                        {member.name}
                      </div>
                    </div>
                    <div className="col-span-5 sm:col-span-4 flex items-center text-gray-500 truncate">
                      {member.email}
                    </div>
                    <div className="col-span-2 hidden sm:flex items-center">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          member.role === "admin"
                            ? "bg-purple-100 text-purple-800"
                            : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {member.role.charAt(0).toUpperCase() +
                          member.role.slice(1)}
                      </span>
                    </div>
                    <div className="col-span-4 sm:col-span-2 flex items-center justify-end space-x-2">
                      <button
                        onClick={() =>
                          router.push(`/tasks?assignedTo=${member._id}`)
                        }
                        className="text-gray-500 hover:text-gray-700"
                        title="View assigned tasks"
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
                            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                          />
                        </svg>
                      </button>
                      <button
                        onClick={() => {
                          const newTask = {
                            title: "",
                            description: "",
                            dueDate: "",
                            assignedTo: member._id,
                          };
                          router.push(`/tasks/new?assignTo=${member._id}`);
                        }}
                        className="text-primary-600 hover:text-primary-800"
                        title="Assign a task"
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
                            d="M12 4v16m8-8H4"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="px-6 py-4 text-center text-gray-500">
                  No team members found
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Stats Summary */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Team Stats
            </h3>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500">Total Team Members</p>
                <p className="text-2xl font-bold text-gray-900">
                  {teamMembers.length}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Administrators</p>
                <p className="text-2xl font-bold text-gray-900">
                  {
                    teamMembers.filter((member) => member.role === "admin")
                      .length
                  }
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Regular Users</p>
                <p className="text-2xl font-bold text-gray-900">
                  {
                    teamMembers.filter((member) => member.role === "user")
                      .length
                  }
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AuthLayout>
  );
}
