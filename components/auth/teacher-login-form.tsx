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
import { BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormError } from "@/components/form-error";
import { FormSuccess } from "@/components/form-success";
import { Input } from "@/components/ui/input";
import { signIn } from "next-auth/react";
import toast from "react-hot-toast";
import { useForm } from "react-hook-form";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { zodResolver } from "@hookform/resolvers/zod";

const TeacherLoginSchema = z.object({
  email: z.string().email({ message: "Email is required" }),
  password: z.string().min(1, { message: "Password is required" }),
});

export const TeacherLoginForm = () => {
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

  const form = useForm<z.infer<typeof TeacherLoginSchema>>({
    resolver: zodResolver(TeacherLoginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = (values: z.infer<typeof TeacherLoginSchema>) => {
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

          if (data.error || data.userType !== "TEACHER") {
            setError(t("messages.notRegisteredTeacher"));
            toast.error(t("messages.notRegisteredTeacher"));
            return;
          }

          setSuccess(t("messages.loginSuccess"));
          toast.success(t("messages.loginSuccessToast"));
          setTimeout(() => {
            window.location.href = callbackUrl || "/teacher/courses";
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
      icon={BookOpen}
      title={t("teacherLogin.title")}
      subtitle={t("teacherLogin.subtitle")}
      bgGradient="from-purple-50 to-pink-100"
      iconBg="bg-purple-500"
      footerLinks={[
        {
          text: t("teacherLogin.noAccount"),
          linkText: t("teacherLogin.registerLink"),
          href: "/auth/teacher/register",
          color: "text-purple-600 hover:text-purple-700",
        },
        {
          text: t("teacherLogin.isStudent"),
          linkText: t("teacherLogin.studentLoginLink"),
          href: "/auth/student/login",
          color: "text-blue-600 hover:text-blue-700",
        },
      ]}
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
                      placeholder={t("fields.teacherEmailPlaceholder")}
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
            className="w-full h-11 bg-purple-600 hover:bg-purple-700"
            size="lg"
          >
            {isPending ? t("teacherLogin.submitting") : t("teacherLogin.submit")}
          </Button>
        </form>
      </Form>
    </AuthFormLayout>
  );
};