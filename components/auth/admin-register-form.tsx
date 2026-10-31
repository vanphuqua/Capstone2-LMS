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
import { registerAdmin } from "@/actions/admin";
import toast from "react-hot-toast";
import { useForm } from "react-hook-form";
import { useTranslations } from "next-intl";
import { zodResolver } from "@hookform/resolvers/zod";

const AdminRegisterSchema = z.object({
  name: z.string().min(1, { message: "Name is required" }),
  email: z.string().email({ message: "Valid email is required" }),
  password: z.string().min(6, { message: "Minimum 6 characters required" }),
  secret: z.string().min(1, { message: "Admin secret is required" }),
});

export const AdminRegisterForm = () => {
  const t = useTranslations("auth");
  const [error, setError] = useState<string | undefined>("");
  const [success, setSuccess] = useState<string | undefined>("");
  const [isPending, startTransition] = useTransition();

  const form = useForm<z.infer<typeof AdminRegisterSchema>>({
    resolver: zodResolver(AdminRegisterSchema),
    defaultValues: { name: "", email: "", password: "", secret: "" },
  });

  const onSubmit = (values: z.infer<typeof AdminRegisterSchema>) => {
    setError("");
    setSuccess("");

    startTransition(() => {
      registerAdmin(values).then((data) => {
        if (data?.error) {
          setError(data.error);
          toast.error(data.error);
        }
        if (data?.success) {
          setSuccess(data.success);
          toast.success(data.success);
          form.reset();
        }
      });
    });
  };

  return (
    <AuthFormLayout
      icon={Shield}
      title={t("adminRegister.title")}
      subtitle={t("adminRegister.subtitle")}
      bgGradient="from-slate-900 via-slate-800 to-slate-900"
      iconBg="bg-slate-900"
      footerLinks={[
        {
          text: t("adminRegister.hasAccount"),
          linkText: t("adminRegister.signInLink"),
          href: "/admin/auth",
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
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("fields.name")}</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      disabled={isPending}
                      placeholder={t("fields.adminNamePlaceholder")}
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
            <FormField
              control={form.control}
              name="secret"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("adminRegister.secret")}</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      disabled={isPending}
                      placeholder={t("adminRegister.secretPlaceholder")}
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
            className="w-full h-11 bg-slate-900 hover:bg-slate-800"
            size="lg"
          >
            {isPending ? t("adminRegister.submitting") : t("adminRegister.submit")}
          </Button>
        </form>
      </Form>
    </AuthFormLayout>
  );
};