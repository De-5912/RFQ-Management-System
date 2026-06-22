"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-100 p-6">
      <div className="max-w-lg rounded-lg border border-rose-200 bg-white p-6 shadow-sm">
        <h1 className="text-lg font-semibold text-zinc-950">Something failed</h1>
        <p className="mt-2 text-sm leading-6 text-zinc-600">{error.message}</p>
        <button
          onClick={reset}
          className="mt-5 rounded-md bg-zinc-950 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
