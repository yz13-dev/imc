import { Button } from "@workspace/ui/components/button";
import { FieldSeparator } from "@workspace/ui/components/field";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@workspace/ui/components/input-group";
import { EyeClosedIcon, KeyIcon, UserCircle2Icon } from "lucide-react";
import Link from "next/link";



export default function Page() {
  return (
    <div className="max-w-md mx-auto flex flex-col gap-8">
      <div className="flex flex-col gap-3 text-balance">
        <h1 className="text-start sm:text-center text-4xl font-medium">Вход</h1>
        <p className="text-start sm:text-center text-muted-foreground">
          Используйте никнейм и пароль для входа.
        </p>
      </div>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-3">
          <InputGroup>
            <InputGroupAddon>
              <UserCircle2Icon />
            </InputGroupAddon>
            <InputGroupInput placeholder="Имя пользователя" />
          </InputGroup>
          <InputGroup>
            <InputGroupAddon>
              <KeyIcon />
            </InputGroupAddon>
            <InputGroupInput placeholder="******" />
            <InputGroupAddon align="inline-end">
              <EyeClosedIcon />
            </InputGroupAddon>
          </InputGroup>
        </div>
        <Button>Продолжить</Button>
      </div>
      <FieldSeparator>Или</FieldSeparator>
      <span className="text-muted-foreground text-sm mx-auto">
        Нет аккаунта? <Link href="/auth/signup" className="text-foreground hover:underline">Зарегистрироваться</Link>
      </span>
    </div>
  )
}
