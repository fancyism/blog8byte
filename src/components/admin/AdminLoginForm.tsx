"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { LogIn, Loader2 } from "lucide-react";
import { signIn } from "next-auth/react";

import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";

function getLoginErrorMessage(error?: string) {
  switch (error) {
    case "CredentialsSignin":
      return "อีเมลหรือรหัสผ่านไม่ถูกต้อง";
    case "CallbackRouteError":
      return "ระบบล็อกอินยังไม่พร้อมใช้งาน กรุณาตรวจสอบฐานข้อมูลแล้วลองใหม่อีกครั้ง";
    default:
      return "เกิดข้อผิดพลาดในการเข้าสู่ระบบ";
  }
}

export function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/admin";

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    try {
      const res = await signIn("credentials", {
        redirect: false,
        email,
        password,
        callbackUrl,
      });

      if (res?.error) {
        setError(getLoginErrorMessage(res.error));
      } else {
        router.push(callbackUrl);
        router.refresh();
      }
    } catch (error) {
      console.error("Admin login failed", error);
      setError("เกิดข้อผิดพลาดในการเข้าสู่ระบบ");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md border-border bg-card">
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="text-2xl font-bold tracking-tight">เข้าสู่ระบบแอดมิน</CardTitle>
        <CardDescription className="text-muted-foreground">
          กรอกอีเมลและรหัสผ่านเพื่อจัดการเนื้อหา Blog8byte
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">อีเมล</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="admin@blog8byte.com"
              required
              disabled={isLoading}
              className="bg-background"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">รหัสผ่าน</Label>
            <Input
              id="password"
              name="password"
              type="password"
              required
              disabled={isLoading}
              className="bg-background"
            />
          </div>

          {error && (
            <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <LogIn className="mr-2 h-4 w-4" />
            )}
            เข้าสู่ระบบ
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
