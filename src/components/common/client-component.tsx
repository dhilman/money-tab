import { useEffect, useState } from "react";

interface Props {
  children: React.ReactNode;
}

export function ClientComponent({ children }: Props) {
  const [isClient, setIsClient] = useState(false);
  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) return null;

  return <>{children}</>;
}
