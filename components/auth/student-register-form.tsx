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
import { GraduationCap } from "lucide-react";
import { Input } from "@/components/ui/input";
import { register } from "@/actions/register";
import toast from "react-hot-toast";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { zodResolver } from "@hookform/resolvers/zod";

const StudentRegisterSchema = z.object({
  name: z.string().min(1, { message: "Name is required" }),
  email: z.string().email({ message: "Valid email is required" }),
  password: z.string().min(6, { message: "Minimum 6 characters required" }),
  rollNo: z.string().optional(),
});

export const StudentRegisterForm = () => {
  const t = useTranslations("auth");
  const [error, setError] = useState<string | undefined>("");
  const [success, setSuccess] = useState<string | undefined>("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const form = useForm<z.infer<typeof StudentRegisterSchema>>({
    resolver: zodResolver(StudentRegisterSchema),
    defaultValues: { name: "", email: "", password: "", rollNo: "" },
  });

  const onSubmit = (values: z.infer<typeof StudentRegisterSchema>) => {
    setError("");
    setSuccess("");

    startTransition(() => {
      register({ ...values, userType: "STUDENT" }).then((data) => {
        if (data?.error) {
          setError(data.error);
          toast.error(data.error);
        }
        if (data?.success) {
          setSuccess(data.success);
          toast.success(data.success);
          form.reset();
          setTimeout(() => router.push("/auth/student/login"), 1000);
        }
      });
    });
  };

  return (
    <AuthFormLayout
      icon={GraduationCap}
      title={t("studentRegister.title")}
      subtitle={t("studentRegister.subtitle")}
      bgGradient="from-blue-50 to-indigo-100"
      iconBg="bg-blue-500"
      footerLinks={[
        {
          text: t("studentRegister.hasAccount"),
          linkText: t("studentRegister.signInLink"),
          href: "/auth/student/login",
          color: "text-blue-600 hover:text-blue-700",
        },
        {
          text: t("studentRegister.isTeacher"),
          linkText: t("studentRegister.teacherRegisterLink"),
          href: "/auth/teacher/register",
          color: "text-purple-600 hover:text-purple-700",
        },
      ]}
      backHref="/auth/student/login"
      backLinkClass="text-blue-600 hover:text-blue-700"
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("fields.name")}</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      disabled={isPending}
                      placeholder={t("fields.namePlaceholder")}
                      className="h-11"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
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
                      placeholder={t("fields.emailPlaceholder")}
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
              name="rollNo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("fields.rollNo")}</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      disabled={isPending}
                      placeholder={t("fields.rollNoPlaceholder")}
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

          <FormError message={error} />
          <FormSuccess message={success} />

          <Button
            disabled={isPending}
            type="submit"
            className="w-full h-11 bg-blue-600 hover:bg-blue-700"
            size="lg"
          >
            {isPending ? t("studentRegister.submitting") : t("studentRegister.submit")}
          </Button>
        </form>
      </Form>
    </AuthFormLayout>
  );
};