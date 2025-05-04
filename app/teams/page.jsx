"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function TeamsRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/team");
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-t-4 border-b-4 border-primary-600 rounded-full animate-spin mx-auto"></div>
        <p className="mt-4 text-gray-700">Redirecting to team page...</p>
      </div>
    </div>
  );
}
