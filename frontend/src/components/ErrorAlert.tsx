import Link from "next/link";
import { ApiError } from "@/lib/api";

export function ErrorAlert({ error }: { error: Error | ApiError | string | null }) {
  if (!error) return null;

  const message = typeof error === "string" ? error : error.message;
  const isLimit = error instanceof ApiError && error.status === 402;

  return (
    <div
      className={`mb-4 border-l-2 px-3 py-2 text-sm ${
        isLimit ? "border-or-500 bg-or-50" : "border-red-400 bg-red-50"
      }`}
    >
      <p className={isLimit ? "text-or-800" : "text-red-800"}>{message}</p>
      {isLimit && (
        <Link href="/pricing" className="mt-2 inline-block font-semibold text-or-600 underline hover:text-or-700">
          Mettre à niveau mon plan
        </Link>
      )}
    </div>
  );
}
