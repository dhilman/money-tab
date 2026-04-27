"use client";

import { useMemo } from "react";
import { useParticipantsCtx } from "~/components/common/participants/provider";
import type { ReceiptData } from "~/lib/receipt";
import { ReceiptProvider } from "./receipt-context";

interface ReceiptProviderWrapperProps {
  initialData?: ReceiptData | null;
  children: React.ReactNode;
}

/**
 * Wrapper that connects ReceiptProvider to ParticipantsContext.
 * Must be used inside ParticipantsProvider.
 */
export function ReceiptProviderWrapper({
  initialData,
  children,
}: ReceiptProviderWrapperProps) {
  const participants = useParticipantsCtx();

  // Extract IDs from all participants (includes both "user" and "new" types)
  const participantIds = useMemo(() => {
    return participants.parties.map((p) => p.id);
  }, [participants.parties]);

  return (
    <ReceiptProvider participantIds={participantIds} initialData={initialData}>
      {children}
    </ReceiptProvider>
  );
}
