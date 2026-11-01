"use client";

import { logout } from "@/actions/logout";
import { useRouter } from "next/navigation";

interface LogoutButtonProps {
  children?: React.ReactNode;
};

export const LogoutButton = ({
  children
}: LogoutButtonProps) => {
  const router = useRouter();

  const onClick = async () => {
    await logout();
    router.push("/auth");
  };

  return (
    <span onClick={onClick} className="cursor-pointer">
    {children}
    </span>
  );
};