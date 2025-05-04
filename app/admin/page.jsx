"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import AuthLayout from "@/components/AuthLayout";

export default function AdminDashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [teams, setTeams] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [expandedTeams, setExpandedTeams] = useState({});
  const [managingUser, setManagingUser] = useState(null);
  const [showManageModal, setShowManageModal] = useState(false);
  const [actionType, setActionType] = useState(""); // 'add' or 'remove'
  const [processing, setProcessing] = useState(false);
  const [actionMessage, setActionMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [targetTeam, setTargetTeam] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch current user
        const userResponse = await axios.get("/api/auth/me");
        const userData = userResponse.data.user;
        setUser(userData);

        // Redirect if user is not an admin
        if (userData.role !== "admin") {
          router.push("/dashboard");
          return;
        }

        // Fetch all teams
        const teamsResponse = await axios.get("/api/admin/teams");
        setTeams(teamsResponse.data.teams);

        // Fetch all users
        const usersResponse = await axios.get("/api/admin/users");
        setUsers(usersResponse.data.users);
      } catch (error) {
        console.error("Error fetching admin data:", error);
        if (error.response?.status === 401 || error.response?.status === 403) {
          router.push("/dashboard");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

  const toggleTeamExpand = (teamId) => {
    setExpandedTeams((prev) => ({
      ...prev,
      [teamId]: !prev[teamId],
    }));
  };

  const getUsersInTeam = (teamId) => {
    return users.filter((user) => user.team && user.team.toString() === teamId);
  };

  const handleSelectTeam = (team) => {
    setSelectedTeam(team);
  };

  const handleManageTeamMember = (userToManage, type, team = null) => {
    setManagingUser(userToManage);
    setActionType(type);
    setTargetTeam(team);
    setShowManageModal(true);
    setActionMessage("");
    setErrorMessage("");
  };

  const handleCancelManage = () => {
    setShowManageModal(false);
    setManagingUser(null);
    setActionType("");
    setTargetTeam(null);
  };

  const handleConfirmManageTeamMember = async () => {
    try {
      setProcessing(true);
      setActionMessage("");
      setErrorMessage("");

      const payload = {
        userId: managingUser._id,
        action: actionType,
      };

      // If adding to a team, include the teamId
      if (actionType === "add") {
        payload.teamId = targetTeam._id;
      }

      const response = await axios.post("/api/admin/teams/members", payload);

      if (response.data.success) {
        setActionMessage(response.data.message);

        // Refresh data
        const [teamsResponse, usersResponse] = await Promise.all([
          axios.get("/api/admin/teams"),
          axios.get("/api/admin/users"),
        ]);

        setTeams(teamsResponse.data.teams);
        setUsers(usersResponse.data.users);

        // If we were viewing details of the team that was modified,
        // update the selected team
        if (
          selectedTeam &&
          ((actionType === "add" && targetTeam._id === selectedTeam._id) ||
            (actionType === "remove" && managingUser.team === selectedTeam._id))
        ) {
          const updatedTeam = teamsResponse.data.teams.find(
            (team) => team._id === selectedTeam._id
          );
          if (updatedTeam) {
            setSelectedTeam(updatedTeam);
          }
        }

        // Close modal after a short delay
        setTimeout(() => {
          setShowManageModal(false);
          setManagingUser(null);
          setActionType("");
          setTargetTeam(null);
        }, 1500);
      }
    } catch (error) {
      setErrorMessage(
        error.response?.data?.message || "Failed to manage team member"
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
          <p className="mt-4 text-gray-700">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user || user.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">Access Denied</h1>
          <p className="mt-4 text-gray-700">
            You don't have permission to access this page.
          </p>
          <button
            onClick={() => router.push("/dashboard")}
            className="mt-4 bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-4 rounded"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <AuthLayout user={user}>
      <div className="pb-12">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">
          Admin Dashboard
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Teams List */}
          <div className="lg:col-span-1">
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Teams</h2>
              <div className="space-y-2">
                {teams.length > 0 ? (
                  teams.map((team) => (
                    <div
                      key={team._id}
                      className="border rounded-lg overflow-hidden"
                    >
                      <div
                        className={`p-3 flex justify-between items-center cursor-pointer ${
                          selectedTeam?._id === team._id
                            ? "bg-primary-50"
                            : "bg-white"
                        }`}
                        onClick={() => handleSelectTeam(team)}
                      >
                        <div>
                          <h3 className="font-medium text-gray-900">
                            {team.name}
                          </h3>
                          <p className="text-sm text-gray-500">
                            Code: {team.teamCode}
                          </p>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleTeamExpand(team._id);
                          }}
                          className="text-gray-500 hover:text-gray-700"
                        >
                          {expandedTeams[team._id] ? (
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-5 w-5"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                            >
                              <path
                                fillRule="evenodd"
                                d="M5 10a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1z"
                                clipRule="evenodd"
                              />
                            </svg>
                          ) : (
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-5 w-5"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                            >
                              <path
                                fillRule="evenodd"
                                d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"
                                clipRule="evenodd"
                              />
                            </svg>
                          )}
                        </button>
                      </div>
                      {expandedTeams[team._id] && (
                        <div className="bg-gray-50 p-3 border-t">
                          <p className="text-sm text-gray-600 mb-2">
                            <span className="font-medium">Description:</span>{" "}
                            {team.description || "No description"}
                          </p>
                          <p className="text-sm text-gray-600 mb-2">
                            <span className="font-medium">Members:</span>{" "}
                            {getUsersInTeam(team._id).length}
                          </p>
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">Created:</span>{" "}
                            {new Date(team.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-6">
                    No teams found
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Selected Team Details */}
          <div className="lg:col-span-2">
            <div className="bg-white shadow rounded-lg p-6">
              {selectedTeam ? (
                <>
                  <div className="mb-6">
                    <h2 className="text-xl font-semibold text-gray-900">
                      {selectedTeam.name}
                    </h2>
                    <p className="text-gray-600">
                      {selectedTeam.description || "No description"}
                    </p>
                    <div className="mt-2 flex items-center">
                      <span className="text-sm font-medium text-gray-500 mr-2">
                        Team Code:
                      </span>
                      <span className="text-sm text-gray-900 bg-gray-100 px-2 py-1 rounded">
                        {selectedTeam.teamCode}
                      </span>
                    </div>
                  </div>

                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Team Members
                  </h3>

                  <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                    <table className="min-w-full divide-y divide-gray-300">
                      <thead className="bg-gray-50">
                        <tr>
                          <th
                            scope="col"
                            className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                          >
                            User
                          </th>
                          <th
                            scope="col"
                            className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                          >
                            Email
                          </th>
                          <th
                            scope="col"
                            className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                          >
                            Role
                          </th>
                          <th
                            scope="col"
                            className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                          >
                            Team
                          </th>
                          <th
                            scope="col"
                            className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900"
                          >
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 bg-white">
                        {getUsersInTeam(selectedTeam._id).map((teamUser) => (
                          <tr key={teamUser._id}>
                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900">
                              <div className="flex items-center">
                                <div className="h-8 w-8 flex-shrink-0 rounded-full bg-primary-100 flex items-center justify-center text-primary-700">
                                  {teamUser.name.charAt(0).toUpperCase()}
                                </div>
                                <div className="ml-4">
                                  <div className="font-medium">
                                    {teamUser.name}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                              {teamUser.email}
                            </td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                              <span
                                className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                                  teamUser.role === "admin"
                                    ? "bg-purple-100 text-purple-800"
                                    : "bg-blue-100 text-blue-800"
                                }`}
                              >
                                {teamUser.role}
                              </span>
                            </td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                              {teamUser.team ? (
                                <span className="bg-green-100 text-green-800 inline-flex rounded-full px-2 text-xs font-semibold leading-5">
                                  {teams.find((t) => t._id === teamUser.team)
                                    ?.name || "Unknown Team"}
                                </span>
                              ) : (
                                <span className="bg-gray-100 text-gray-800 inline-flex rounded-full px-2 text-xs font-semibold leading-5">
                                  No Team
                                </span>
                              )}
                            </td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm text-right">
                              {/* Show different actions based on team membership */}
                              {teamUser.team ? (
                                <button
                                  onClick={() =>
                                    handleManageTeamMember(teamUser, "remove")
                                  }
                                  className="text-red-600 hover:text-red-800 font-medium"
                                >
                                  Remove from team
                                </button>
                              ) : (
                                selectedTeam && (
                                  <button
                                    onClick={() =>
                                      handleManageTeamMember(
                                        teamUser,
                                        "add",
                                        selectedTeam
                                      )
                                    }
                                    className="text-green-600 hover:text-green-800 font-medium"
                                  >
                                    Add to {selectedTeam.name}
                                  </button>
                                )
                              )}
                            </td>
                          </tr>
                        ))}
                        {getUsersInTeam(selectedTeam._id).length === 0 && (
                          <tr>
                            <td
                              colSpan="3"
                              className="px-3 py-4 text-sm text-gray-500 text-center"
                            >
                              No members in this team
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : (
                <div className="text-center py-10">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="mx-auto h-12 w-12 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1}
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">
                    No team selected
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Select a team from the list to view details
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* All Users Section */}
        <div className="mt-8">
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              All Users
            </h2>
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      scope="col"
                      className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                    >
                      User
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                    >
                      Email
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                    >
                      Role
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                    >
                      Team
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900"
                    >
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {users.map((user) => (
                    <tr key={user._id}>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900">
                        <div className="flex items-center">
                          <div className="h-8 w-8 flex-shrink-0 rounded-full bg-primary-100 flex items-center justify-center text-primary-700">
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="ml-4">
                            <div className="font-medium">{user.name}</div>
                          </div>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {user.email}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        <span
                          className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                            user.role === "admin"
                              ? "bg-purple-100 text-purple-800"
                              : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          {user.role}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {user.team ? (
                          <span className="bg-green-100 text-green-800 inline-flex rounded-full px-2 text-xs font-semibold leading-5">
                            {teams.find((t) => t._id === user.team)?.name ||
                              "Unknown Team"}
                          </span>
                        ) : (
                          <span className="bg-gray-100 text-gray-800 inline-flex rounded-full px-2 text-xs font-semibold leading-5">
                            No Team
                          </span>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-right">
                        {/* Show different actions based on team membership */}
                        {user.team ? (
                          <button
                            onClick={() =>
                              handleManageTeamMember(user, "remove")
                            }
                            className="text-red-600 hover:text-red-800 font-medium"
                          >
                            Remove from team
                          </button>
                        ) : (
                          selectedTeam && (
                            <button
                              onClick={() =>
                                handleManageTeamMember(
                                  user,
                                  "add",
                                  selectedTeam
                                )
                              }
                              className="text-green-600 hover:text-green-800 font-medium"
                            >
                              Add to {selectedTeam.name}
                            </button>
                          )
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Team Member Management Modal */}
      {showManageModal && managingUser && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 transition-opacity"
              aria-hidden="true"
            >
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <span
              className="hidden sm:inline-block sm:align-middle sm:h-screen"
              aria-hidden="true"
            >
              &#8203;
            </span>

            <div
              className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full"
              role="dialog"
              aria-modal="true"
              aria-labelledby="modal-headline"
            >
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div
                    className={`mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full ${
                      actionType === "add" ? "bg-green-100" : "bg-red-100"
                    } sm:mx-0 sm:h-10 sm:w-10`}
                  >
                    {actionType === "add" ? (
                      <svg
                        className="h-6 w-6 text-green-600"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                        />
                      </svg>
                    ) : (
                      <svg
                        className="h-6 w-6 text-red-600"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    )}
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3
                      className="text-lg leading-6 font-medium text-gray-900"
                      id="modal-headline"
                    >
                      {actionType === "add"
                        ? "Add to Team"
                        : "Remove from Team"}
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        {actionType === "add"
                          ? `Are you sure you want to add ${managingUser.name} to ${targetTeam?.name}?`
                          : `Are you sure you want to remove ${managingUser.name} from their current team?`}
                      </p>

                      {actionMessage && (
                        <div className="mt-3 p-2 bg-green-50 text-green-700 rounded-md">
                          {actionMessage}
                        </div>
                      )}

                      {errorMessage && (
                        <div className="mt-3 p-2 bg-red-50 text-red-700 rounded-md">
                          {errorMessage}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={handleConfirmManageTeamMember}
                  disabled={processing}
                  className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 text-base font-medium text-white ${
                    actionType === "add"
                      ? "bg-green-600 hover:bg-green-700 focus:ring-green-500"
                      : "bg-red-600 hover:bg-red-700 focus:ring-red-500"
                  } focus:outline-none focus:ring-2 focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm`}
                >
                  {processing
                    ? "Processing..."
                    : actionType === "add"
                    ? "Add"
                    : "Remove"}
                </button>
                <button
                  type="button"
                  onClick={handleCancelManage}
                  disabled={processing}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AuthLayout>
  );
}
