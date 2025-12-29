import { createContext, useContext, useEffect } from "react";

export interface MainButtonProps {
  label: string;
  disabled?: boolean;
  loading?: boolean;
}

export type HeaderColor = "bg_color" | "secondary_bg_color";

export interface Platform {
  type: "tg" | "web";
  haptic: {
    notification: (type: "error" | "success" | "warning") => void;
  };
  confirmDialog: (message: string) => Promise<boolean>;
  register: () => Promise<boolean>;
  openTgLink: (link: string) => void;
  openLink: (link: string) => void;
  close: () => void;
  setHeaderColor: (color: HeaderColor) => void;
  setOnBack: (onBack?: () => void) => void;
  BackButton: React.ComponentType;
  setOnMain: (onMain?: () => void) => void;
  MainButton: React.ComponentType<MainButtonProps>;
}

export const PlatformContext = createContext<Platform | null>(null);

export function usePlatform() {
  const context = useContext(PlatformContext);
  if (!context) {
    throw new Error("usePlatform must be used within a PlatformProvider");
  }
  return context;
}

interface BackButtonProps {
  onClick?: () => void;
}

export const BackButton = ({ onClick }: BackButtonProps) => {
  const { BackButton, setOnBack } = usePlatform();
  useEffect(() => {
    if (!onClick) return;
    setOnBack(onClick);
    return () => setOnBack();
  }, [onClick, setOnBack]);

  return <BackButton />;
};

interface MainProps {
  onClick: () => void;
  label: string;
  disabled?: boolean;
  isLoading?: boolean;
}

export const MainButton = ({
  onClick,
  label,
  disabled,
  isLoading,
}: MainProps) => {
  const { setOnMain, MainButton } = usePlatform();
  useEffect(() => {
    console.log("MainButton: setting on main");
    setOnMain(onClick);
  }, [setOnMain, onClick]);
  return <MainButton label={label} disabled={disabled} loading={isLoading} />;
};
