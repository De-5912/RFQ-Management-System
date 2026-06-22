"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

const messages: Record<string, string> = {
  created: "Created successfully.",
  saved: "Saved successfully.",
  sent: "RFQ emails logged/sent successfully.",
  submitted: "Quotation submitted successfully.",
  approved: "Approval decision saved.",
  selected: "Final vendor selection recorded.",
  po: "PO status updated.",
};

export function ToastFromSearch() {
  const searchParams = useSearchParams();
  const [dismissedKey, setDismissedKey] = useState<string | null>(null);
  const messageKey = Array.from(searchParams.keys()).find((key) => messages[key]);

  useEffect(() => {
    if (!messageKey) return;
    const timer = window.setTimeout(() => setDismissedKey(messageKey), 3500);
    return () => window.clearTimeout(timer);
  }, [messageKey]);

  if (!messageKey || dismissedKey === messageKey) return null;

  return (
    <div className="fixed right-4 top-4 z-50 rounded-lg border border-emerald-200 bg-white px-4 py-3 text-sm font-medium text-emerald-800 shadow-lg">
      {messages[messageKey]}
    </div>
  );
}
