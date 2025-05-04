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
  const [userTeam, setUserTeam] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showJoinForm, setShowJoinForm] = useState(false);
  const [createFormData, setCreateFormData] = useState({
    name: "",
    description: "",
    teamCode: "",
    password: "",
  });
  const [joinFormData, setJoinFormData] = useState({
    teamCode: "",
    password: "",
  });
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");

  useEffect(() => {
    const fetchUserAndTeam = async () => {
      try {
        // Fetch current user
        const userResponse = await axios.get("/api/auth/me");
        setUser(userResponse.data.user);

        // Fetch team members if user has a team
        if (userResponse.data.user.team) {
          try {
            const teamResponse = await axios.get(
              `/api/teams/${userResponse.data.user.team}`
            );
            setUserTeam(teamResponse.data.team);
            setTeamMembers(teamResponse.data.members);
          } catch (teamError) {
            console.error("Error fetching team data:", teamError);
            // Reset team reference if team doesn't exist or there's an error
            if (teamError.response?.status === 404) {
              setUserTeam(null);
            }
          }
        } else {
          setTeamMembers([]);
          setUserTeam(null);
        }
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

  const handleCreateChange = (e) => {
    setCreateFormData({
      ...createFormData,
      [e.target.name]: e.target.value,
    });
  };

  const handleJoinChange = (e) => {
    setJoinFormData({
      ...joinFormData,
      [e.target.name]: e.target.value,
    });
  };

  const handleCreateTeam = async (e) => {
    e.preventDefault();
    setFormError("");
    setFormSuccess("");

    try {
      setLoading(true);
      const response = await axios.post("/api/teams", createFormData);

      if (response.data.success) {
        // First update the team info
        setUserTeam(response.data.team);
        setFormSuccess("Team created successfully!");
        setShowCreateForm(false);
        setCreateFormData({
          name: "",
          description: "",
          teamCode: "",
          password: "",
        });

        try {
          // Refresh team members with separate request to ensure we have the latest data
          const teamMembersResponse = await axios.get(
            `/api/teams/${response.data.team._id}`
          );
          setTeamMembers(teamMembersResponse.data.members);

          // Refresh the user data to ensure team association is updated locally
          const userResponse = await axios.get("/api/auth/me");
          setUser(userResponse.data.user);
        } catch (refreshError) {
          console.error(
            "Error refreshing data after creating team:",
            refreshError
          );
        }
      }
    } catch (error) {
      setFormError(error.response?.data?.message || "Failed to create team");
    } finally {
      setLoading(false);
    }
  };

  const handleJoinTeam = async (e) => {
    e.preventDefault();
    setFormError("");
    setFormSuccess("");

    try {
      setLoading(true);
      const response = await axios.post("/api/teams/join", joinFormData);

      if (response.data.success) {
        // First update the team info
        setUserTeam(response.data.team);
        setFormSuccess("Successfully joined team!");
        setShowJoinForm(false);
        setJoinFormData({
          teamCode: "",
          password: "",
        });

        try {
          // Refresh team members with separate request to ensure we have the latest data
          const teamMembersResponse = await axios.get(
            `/api/teams/${response.data.team._id}`
          );
          setTeamMembers(teamMembersResponse.data.members);

          // Refresh the user data to ensure team association is updated locally
          const userResponse = await axios.get("/api/auth/me");
          setUser(userResponse.data.user);
        } catch (refreshError) {
          console.error(
            "Error refreshing data after joining team:",
            refreshError
          );
        }
      }
    } catch (error) {
      setFormError(error.response?.data?.message || "Failed to join team");
    } finally {
      setLoading(false);
    }
  };

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
        {!userTeam ? (
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Join or Create a Team
            </h1>
            <p className="text-gray-600 mb-6">
              You need to be part of a team to assign and manage tasks. You can
              either create a new team or join an existing one.
            </p>

            <div className="flex flex-wrap gap-4">
              <button
                onClick={() => {
                  setShowCreateForm(true);
                  setShowJoinForm(false);
                }}
                className="bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-4 rounded"
              >
                Create New Team
              </button>
              <button
                onClick={() => {
                  setShowJoinForm(true);
                  setShowCreateForm(false);
                }}
                className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-2 px-4 rounded"
              >
                Join Existing Team
              </button>
            </div>

            {formError && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700">
                {formError}
              </div>
            )}

            {formSuccess && (
              <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md text-green-700">
                {formSuccess}
              </div>
            )}

            {showCreateForm && (
              <div className="mt-6 p-6 bg-white rounded-lg shadow-md">
                <h2 className="text-xl font-semibold mb-4">
                  Create a New Team
                </h2>
                <form onSubmit={handleCreateTeam}>
                  <div className="space-y-4">
                    <div>
                      <label
                        htmlFor="name"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Team Name*
                      </label>
                      <input
                        id="name"
                        name="name"
                        type="text"
                        required
                        className="input-field mt-1"
                        value={createFormData.name}
                        onChange={handleCreateChange}
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="description"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Description
                      </label>
                      <textarea
                        id="description"
                        name="description"
                        rows="3"
                        className="input-field mt-1"
                        value={createFormData.description}
                        onChange={handleCreateChange}
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="teamCode"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Team Code*
                      </label>
                      <input
                        id="teamCode"
                        name="teamCode"
                        type="text"
                        required
                        className="input-field mt-1"
                        value={createFormData.teamCode}
                        onChange={handleCreateChange}
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        Team code must be unique. This will be used by others to
                        join your team.
                      </p>
                    </div>

                    <div>
                      <label
                        htmlFor="password"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Team Password*
                      </label>
                      <input
                        id="password"
                        name="password"
                        type="password"
                        required
                        className="input-field mt-1"
                        value={createFormData.password}
                        onChange={handleCreateChange}
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        Minimum 6 characters. This password will be shared with
                        team members.
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 flex items-center justify-end space-x-3">
                    <button
                      type="button"
                      onClick={() => setShowCreateForm(false)}
                      className="text-gray-700 hover:text-gray-900"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-4 rounded"
                    >
                      {loading ? "Creating..." : "Create Team"}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {showJoinForm && (
              <div className="mt-6 p-6 bg-white rounded-lg shadow-md">
                <h2 className="text-xl font-semibold mb-4">
                  Join Existing Team
                </h2>
                <form onSubmit={handleJoinTeam}>
                  <div className="space-y-4">
                    <div>
                      <label
                        htmlFor="teamCode"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Team Code*
                      </label>
                      <input
                        id="teamCode"
                        name="teamCode"
                        type="text"
                        required
                        className="input-field mt-1"
                        value={joinFormData.teamCode}
                        onChange={handleJoinChange}
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="password"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Team Password*
                      </label>
                      <input
                        id="password"
                        name="password"
                        type="password"
                        required
                        className="input-field mt-1"
                        value={joinFormData.password}
                        onChange={handleJoinChange}
                      />
                    </div>
                  </div>

                  <div className="mt-6 flex items-center justify-end space-x-3">
                    <button
                      type="button"
                      onClick={() => setShowJoinForm(false)}
                      className="text-gray-700 hover:text-gray-900"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-4 rounded"
                    >
                      {loading ? "Joining..." : "Join Team"}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        ) : (
          <>
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold text-gray-900">Team Members</h1>
              <div className="text-xl">
                Team: <span className="font-semibold">{userTeam.name}</span>
              </div>
            </div>

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

            {/* Team Info */}
            <div className="mb-6 bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">
                Team Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Team Name</p>
                  <p className="font-medium">{userTeam.name}</p>
                </div>
                {userTeam.description && (
                  <div>
                    <p className="text-sm text-gray-500">Description</p>
                    <p className="font-medium">{userTeam.description}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-gray-500">Team Code</p>
                  <p className="font-medium">{userTeam.teamCode}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Members</p>
                  <p className="font-medium">{teamMembers.length}</p>
                </div>
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
          </>
        )}
      </div>
    </AuthLayout>
  );
}
