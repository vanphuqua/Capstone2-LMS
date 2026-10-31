"use client";

import * as z from "zod";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useState, useTransition } from "react";

import { AuthFormLayout } from "@/components/auth/auth-form-layout";
import { Button } from "@/components/ui/button";
import { FormError } from "@/components/form-error";
import { FormSuccess } from "@/components/form-success";
import { Input } from "@/components/ui/input";
import { Shield } from "lucide-react";
import { signIn } from "next-auth/react";
import toast from "react-hot-toast";
import { useForm } from "react-hook-form";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { zodResolver } from "@hookform/resolvers/zod";

const AdminLoginSchema = z.object({
  email: z.string().email({ message: "Email is required" }),
  password: z.string().min(1, { message: "Password is required" }),
});

export const AdminLoginForm = () => {
  const t = useTranslations("auth");
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl");
  const urlError =
    searchParams.get("error") === "OAuthAccountNotLinked"
      ? t("messages.oauthEmailInUse")
      : "";

  const [error, setError] = useState<string | undefined>("");
  const [success, setSuccess] = useState<string | undefined>("");
  const [isPending, startTransition] = useTransition();

  const form = useForm<z.infer<typeof AdminLoginSchema>>({
    resolver: zodResolver(AdminLoginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = (values: z.infer<typeof AdminLoginSchema>) => {
    setError("");
    setSuccess("");

    startTransition(async () => {
      try {
        const result = await signIn("credentials", {
          email: values.email,
          password: values.password,
          redirect: false,
        });

        if (result?.error) {
          setError(t("messages.invalidCredentials"));
          toast.error(t("messages.invalidCredentials"));
          return;
        }

        if (result?.ok) {
          await new Promise((resolve) => setTimeout(resolve, 500));

          const response = await fetch("/api/auth/check-role");
          const data = await response.json();

          if (data.error || data.role !== "ADMIN") {
            setError(t("messages.notRegisteredAdmin"));
            toast.error(t("messages.notRegisteredAdmin"));
            return;
          }

          setSuccess(t("messages.loginSuccess"));
          toast.success(t("messages.loginSuccessToast"));
          setTimeout(() => {
            window.location.href = callbackUrl || "/admin";
          }, 500);
        }
      } catch {
        setError(t("messages.somethingWentWrong"));
        toast.error(t("messages.somethingWentWrong"));
      }
    });
  };

  return (
    <AuthFormLayout
      icon={Shield}
      title={t("adminLogin.title")}
      subtitle={t("adminLogin.subtitle")}
      bgGradient="from-slate-900 via-slate-800 to-slate-900"
      iconBg="bg-slate-900"
      footerLinks={[
        {
          text: t("adminLogin.noAccount"),
          linkText: t("adminLogin.registerLink"),
          href: "/admin/auth/register",
          color: "text-slate-900 hover:text-slate-700",
        },
      ]}
      backLinkClass="text-gray-300 hover:text-white"
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("fields.email")}</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      disabled={isPending}
                      placeholder={t("fields.adminEmailPlaceholder")}
                      type="email"
                      className="h-11"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("fields.password")}</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      disabled={isPending}
                      placeholder="••••••••"
                      type="password"
                      className="h-11"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormError message={error || urlError} />
          <FormSuccess message={success} />

          <Button
            disabled={isPending}
            type="submit"
            className="w-full h-11 bg-slate-900 hover:bg-slate-800"
            size="lg"
          >
            {isPending ? t("adminLogin.submitting") : t("adminLogin.submit")}
          </Button>
        </form>
      </Form>
    </AuthFormLayout>
  );
};