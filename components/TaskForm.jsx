"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { format } from "date-fns";
import axios from "axios";

export default function TaskForm({
  task,
  teamMembers,
  onSubmit,
  isSubmitting,
  initialAssignedTo,
}) {
  const [isRecurring, setIsRecurring] = useState(task?.isRecurring || false);
  const [selectedTags, setSelectedTags] = useState(task?.tags || []);
  const [tagInput, setTagInput] = useState("");
  const [loadingTeamMembers, setLoadingTeamMembers] = useState(false);
  const [availableTeamMembers, setAvailableTeamMembers] = useState(
    teamMembers || []
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm({
    defaultValues: {
      title: task?.title || "",
      description: task?.description || "",
      dueDate: task?.dueDate
        ? format(new Date(task.dueDate), "yyyy-MM-dd")
        : "",
      priority: task?.priority || "medium",
      status: task?.status || "todo",
      assignedTo: initialAssignedTo || task?.assignedTo?._id || "",
      isRecurring: task?.isRecurring || false,
      recurringPattern: task?.recurringPattern || "none",
    },
  });

  // If team members weren't provided, fetch them from the user's team
  useEffect(() => {
    if (!teamMembers && !loadingTeamMembers) {
      setLoadingTeamMembers(true);

      // First get current user to get team ID
      axios
        .get("/api/auth/me")
        .then((response) => {
          const user = response.data.user;
          if (user.team) {
            // Fetch team members
            return axios.get(`/api/teams/${user.team}`);
          } else {
            throw new Error("User is not in a team");
          }
        })
        .then((response) => {
          setAvailableTeamMembers(response.data.members);
        })
        .catch((error) => {
          console.error("Error fetching team members:", error);
        })
        .finally(() => {
          setLoadingTeamMembers(false);
        });
    }
  }, [teamMembers, loadingTeamMembers]);

  // Set initialAssignedTo when available
  useEffect(() => {
    if (initialAssignedTo && initialAssignedTo !== "") {
      setValue("assignedTo", initialAssignedTo);
    }
  }, [initialAssignedTo, setValue]);

  // Watch for isRecurring changes
  useEffect(() => {
    const subscription = watch((value, { name }) => {
      if (name === "isRecurring") {
        setIsRecurring(value.isRecurring);
      }
    });
    return () => subscription.unsubscribe();
  }, [watch]);

  // Handle tag input
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && tagInput.trim()) {
      e.preventDefault();
      if (!selectedTags.includes(tagInput.trim())) {
        setSelectedTags([...selectedTags, tagInput.trim()]);
      }
      setTagInput("");
    }
  };

  const removeTag = (tagToRemove) => {
    setSelectedTags(selectedTags.filter((tag) => tag !== tagToRemove));
  };

  // Submit handler
  const handleFormSubmit = (data) => {
    // Add tags to the data
    data.tags = selectedTags;
    onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      <div>
        <label
          htmlFor="title"
          className="block text-sm font-medium text-gray-700"
        >
          Title *
        </label>
        <input
          id="title"
          type="text"
          {...register("title", { required: "Title is required" })}
          className="input-field mt-1"
          placeholder="Task title"
        />
        {errors.title && (
          <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
        )}
      </div>

      <div>
        <label
          htmlFor="description"
          className="block text-sm font-medium text-gray-700"
        >
          Description *
        </label>
        <textarea
          id="description"
          rows={4}
          {...register("description", { required: "Description is required" })}
          className="input-field mt-1"
          placeholder="Task description"
        />
        {errors.description && (
          <p className="mt-1 text-sm text-red-600">
            {errors.description.message}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label
            htmlFor="dueDate"
            className="block text-sm font-medium text-gray-700"
          >
            Due Date *
          </label>
          <input
            id="dueDate"
            type="date"
            {...register("dueDate", { required: "Due date is required" })}
            className="input-field mt-1"
          />
          {errors.dueDate && (
            <p className="mt-1 text-sm text-red-600">
              {errors.dueDate.message}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="priority"
            className="block text-sm font-medium text-gray-700"
          >
            Priority
          </label>
          <select
            id="priority"
            {...register("priority")}
            className="input-field mt-1"
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label
            htmlFor="status"
            className="block text-sm font-medium text-gray-700"
          >
            Status
          </label>
          <select
            id="status"
            {...register("status")}
            className="input-field mt-1"
          >
            <option value="todo">To Do</option>
            <option value="in-progress">In Progress</option>
            <option value="review">Review</option>
            <option value="completed">Completed</option>
          </select>
        </div>

        <div>
          <label
            htmlFor="assignedTo"
            className="block text-sm font-medium text-gray-700"
          >
            Assign To
          </label>
          <select
            id="assignedTo"
            {...register("assignedTo")}
            className="input-field mt-1"
            disabled={loadingTeamMembers}
          >
            <option value="">Unassigned</option>
            {availableTeamMembers.map((member) => (
              <option key={member._id} value={member._id}>
                {member.name}
              </option>
            ))}
          </select>
          {loadingTeamMembers && (
            <p className="mt-1 text-sm text-gray-500">
              Loading team members...
            </p>
          )}
        </div>
      </div>

      <div>
        <div className="flex items-center">
          <input
            id="isRecurring"
            type="checkbox"
            {...register("isRecurring")}
            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
          />
          <label
            htmlFor="isRecurring"
            className="ml-2 block text-sm text-gray-700"
          >
            This is a recurring task
          </label>
        </div>

        {isRecurring && (
          <div className="mt-3">
            <label
              htmlFor="recurringPattern"
              className="block text-sm font-medium text-gray-700"
            >
              Recurring Pattern
            </label>
            <select
              id="recurringPattern"
              {...register("recurringPattern")}
              className="input-field mt-1"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>
        )}
      </div>

      <div>
        <label
          htmlFor="tags"
          className="block text-sm font-medium text-gray-700"
        >
          Tags
        </label>
        <div className="mt-1">
          <div className="flex flex-wrap gap-2 mb-2">
            {selectedTags.map((tag, index) => (
              <div
                key={index}
                className="bg-primary-100 text-primary-800 px-2 py-1 rounded-full text-sm flex items-center"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  className="ml-1 text-primary-600 hover:text-primary-800 focus:outline-none"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </div>
            ))}
          </div>
          <input
            id="tags"
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="input-field"
            placeholder="Type a tag and press Enter"
          />
          <p className="mt-1 text-xs text-gray-500">Press Enter to add a tag</p>
        </div>
      </div>

      <div className="flex justify-end pt-5">
        <button
          type="submit"
          disabled={isSubmitting}
          className="btn btn-primary"
        >
          {isSubmitting ? "Saving..." : task ? "Update Task" : "Create Task"}
        </button>
      </div>
    </form>
  );
}
