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

  // Extract IDs from all participants (includes both "user" and "new" types)
  const participantIds = useMemo(() => {
    return participants.parties.map((p) => p.id);
  }, [participants.parties]);

  return (
    <ReceiptProvider participantIds={participantIds}>
      {children}
    </ReceiptProvider>
  );
}
