"use client";

import { useMemo } from "react";
import { useParticipantsCtx } from "~/components/common/participants/provider";
import { ReceiptProvider } from "./receipt-context";

interface ReceiptProviderWrapperProps {
  children: React.ReactNode;
}

/**
 * Wrapper that connects ReceiptProvider to ParticipantsContext.
 * Must be used inside ParticipantsProvider.
 */
export function ReceiptProviderWrapper({
  children,
}: ReceiptProviderWrapperProps) {
  const participants = useParticipantsCtx();

  // Extract user IDs from participants (filter out null for non-user participants)
  const participantIds = useMemo(() => {
    return participants.parties
      .filter((p) => p.type === "user")
      .map((p) => p.id);
  }, [participants.parties]);

  return (
    <ReceiptProvider participantIds={participantIds}>
      {children}
    </ReceiptProvider>
  );
}
