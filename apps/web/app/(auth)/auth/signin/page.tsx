import { FieldSeparator } from "@workspace/ui/components/field";
import Link from "next/link";
import Form from "./components/form";


type PageProps = {
  searchParams: Promise<{ next?: string }>;
};
export default async function Page({ searchParams }: PageProps) {

  const { next } = await searchParams;


  return (
    <div className="max-w-md mx-auto flex flex-col gap-8">
      <div className="flex flex-col gap-3 text-balance">
        <h1 className="text-start sm:text-center text-4xl font-medium">Вход</h1>
        <p className="text-start sm:text-center text-muted-foreground">
          Используйте никнейм и пароль для входа.
        </p>
      </div>
      <div className="flex flex-col gap-6">
        <Form next={next} />
      </div>
      <FieldSeparator>Или</FieldSeparator>
      <span className="text-muted-foreground text-sm mx-auto">
        Нет аккаунта? <Link href="/auth/signup" className="text-foreground hover:underline">Зарегистрироваться</Link>
      </span>
    </div>
  )
}
