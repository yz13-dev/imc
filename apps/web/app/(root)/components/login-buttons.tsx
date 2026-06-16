import { getMe } from "@/lib/me";
import { Button } from "@workspace/ui/components/button";
import { Skeleton } from "@workspace/ui/components/skeleton";
import Link from "next/link";

export function LoginButtonsSkeleton() {
  return (
    <div className="flex items-center gap-3">
      <Skeleton className="w-[70px] h-9" />
      <Skeleton className="w-[142px] h-9" />
    </div>
  );
}

export default async function LoginButtons() {
  const user = await getMe()
  if (user) return (
    <Button variant="secondary" nativeButton={false} render={<Link href="/dashboard" />}>
      <span>К доске</span>
    </Button>
  )
  return (
    <div className="flex items-center gap-3">
      <Button variant="secondary" className="w-[70px]" nativeButton={false} render={<Link href="/auth/signin" />}>
        <span>Войти</span>
      </Button>
      <Button variant="default" className="w-[142px]" nativeButton={false} render={<Link href="/auth/signup" />}>
        <span>Создать аккаунт</span>
      </Button>
    </div>
  );
}
