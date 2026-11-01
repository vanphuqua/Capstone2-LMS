"use client";

import { FormError } from "@/components/form-error";
import { UserRole } from "@prisma/client";
import { useCurrentRole } from "@/hooks/use-current-role";
import { useTranslations } from "next-intl";

interface RoleGateProps {
  children: React.ReactNode;
  allowedRole: UserRole;
}

export const RoleGate = ({
  children,
  allowedRole,
}: RoleGateProps) => {
  const t = useTranslations("auth.error");
  const role = useCurrentRole();

  if (role !== allowedRole) {
    return (
      <FormError message={t("noPermission")} />
    );
  }

  return (
    <>
      {children}
    </>
  );
};