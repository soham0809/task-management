"use client";

import { useState } from "react";
import Link from "next/link";
import { format, isPast, isToday } from "date-fns";

export default function TaskCard({ task }) {
  const [isOpen, setIsOpen] = useState(false);

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "low":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "in-progress":
        return "bg-blue-100 text-blue-800";
      case "review":
        return "bg-purple-100 text-purple-800";
      case "todo":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getDueDateColor = (dueDate) => {
    if (task.status === "completed") return "text-gray-500";
    if (isPast(new Date(dueDate)) && !isToday(new Date(dueDate)))
      return "text-red-600";
    if (isToday(new Date(dueDate))) return "text-yellow-600";
    return "text-gray-500";
  };

  return (
    <div className="bg-white shadow rounded-lg hover:shadow-md transition-all duration-200">
      <div className="p-4">
        <div className="flex justify-between items-start">
          <Link
            href={`/tasks/${task._id}`}
            className="text-lg font-medium text-gray-900 hover:text-primary-600"
          >
            {task.title}
          </Link>
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(
              task.priority
            )}`}
          >
            {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
          </span>
        </div>

        <div className="mt-2">
          <p className="text-sm text-gray-500 line-clamp-2">
            {task.description}
          </p>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center">
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                task.status
              )}`}
            >
              {task.status
                .replace("-", " ")
                .replace(/\b\w/g, (l) => l.toUpperCase())}
            </span>
          </div>
          <div className={`text-sm ${getDueDateColor(task.dueDate)}`}>
            {format(new Date(task.dueDate), "MMM d, yyyy")}
          </div>
        </div>

        {isOpen && (
          <div className="mt-4 pt-3 border-t border-gray-200">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Assigned to:</p>
                <p className="font-medium">
                  {task.assignedTo?.name || "Unassigned"}
                </p>
              </div>
              <div>
                <p className="text-gray-500">Created by:</p>
                <p className="font-medium">{task.creator?.name || "Unknown"}</p>
              </div>

              {task.tags?.length > 0 && (
                <div className="col-span-2 mt-2">
                  <p className="text-gray-500 mb-1">Tags:</p>
                  <div className="flex flex-wrap gap-1">
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

              {task.isRecurring && (
                <div className="col-span-2 mt-2">
                  <p className="text-gray-500">
                    Recurring:{" "}
                    <span className="font-medium">{task.recurringPattern}</span>
                  </p>
                </div>
              )}
            </div>

            <div className="mt-4 flex justify-end">
              <Link
                href={`/tasks/${task._id}`}
                className="text-primary-600 hover:text-primary-700 text-sm font-medium"
              >
                View details
              </Link>
            </div>
          </div>
        )}

        <button
          className="mt-3 w-full flex justify-center items-center py-1 text-sm text-gray-500 hover:text-gray-700 focus:outline-none"
          onClick={() => setIsOpen(!isOpen)}
        >
          <span>{isOpen ? "Show less" : "Show more"}</span>
          <svg
            className={`ml-1 h-4 w-4 transition-transform duration-200 ${
              isOpen ? "transform rotate-180" : ""
            }`}
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
