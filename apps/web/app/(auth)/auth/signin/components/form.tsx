"use client"

import { axios } from "@/lib/axios-client"
import { useForm } from "@tanstack/react-form-nextjs"
import { Button } from "@workspace/ui/components/button"
import { Field, FieldError } from "@workspace/ui/components/field"
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from "@workspace/ui/components/input-group"
import { toast } from "@workspace/ui/components/sonner"
import { Spinner } from "@workspace/ui/components/spinner"
import { EyeClosedIcon, EyeIcon, KeyIcon, MailIcon, UserCircle2Icon } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import z from "zod"

const formSchema = z.object({
  "email-or-username": z
    .string()
    .min(3, "Почта или никнейм должен быть минимум 3 символа")
    .refine((v) => {
      if (v.includes("@")) return z.email().safeParse(v).success
      return z.string().min(3).max(20).regex(/^(?!_)(?!.*__)[a-zA-Z0-9_]+(?<!_)$/).safeParse(v).success
    }),
  password: z
    .string()
    .min(8, "Пароль должен быть минимум 8 символов")
})

const signIn = async (email: string, password: string) => {
  const base = `http://localhost:8080`
  try {
    const { data, error } = await axios({
      method: "POST",
      url: new URL("/auth/signin/credential", base).toString(),
      headers: {
        Origin: "http://localhost:3000",
        "Content-Type": "application/json",
      },
      withCredentials: true,
      data: {
        "credential": email,
        "password": password,
        "remember_me": true
      }
    })
    return { data, error: error?.message }
  } catch (error) {
    return { data: null, error: error instanceof Error ? error.message : String(error) }
  }
}

export default function Form({ next = "/" }: { next?: string }) {

  const [showPassword, setShowPassword] = useState<boolean>(false)
  const [ready, setReady] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const router = useRouter()

  const disabled = !ready || loading;

  const form = useForm({
    defaultValues: {
      "email-or-username": "",
      password: "",
    },
    validators: {
      onChange: formSchema,
      onSubmit: formSchema
    },
    listeners: {
      onChangeDebounceMs: 250,
      onChange: ({ formApi }) => {
        setReady(formApi.state.isFormValid)
      }
    },
    onSubmit: async ({ value }) => {
      const isEmail = value["email-or-username"].includes("@")
      setLoading(true)
      const toastId = toast.loading("Входим в аккаунт")
      try {
        if (isEmail) {
          const { data, error } = await signIn(
            value["email-or-username"],
            value.password
          )
          if (error) {
            toast.error(error, {
              id: toastId
            })
          } else {
            toast.success("Вход выполнен", {
              id: toastId
            })
            router.push(next)
            // if (data.redirect && data.url) {
            //   router.push(data.url)
            // } else router.push(next)
          }
        }
        if (!isEmail) {
          const { data, error } = await signIn(
            value["email-or-username"],
            value.password
          )

          if (error) {
            toast.error(error, {
              id: toastId
            })
          } else {
            toast.success("Вход выполнен", {
              id: toastId
            })
            router.push(next)
          }
        }

      } catch (error) {
        toast.error("Ошибка", {
          id: toastId
        })
      } finally {
        setLoading(false)
      }
    },
  })

  return (
    <form
      id="signin-form"
      onSubmit={(e) => {
        e.preventDefault()
        form.handleSubmit()
      }}
      className="flex flex-col gap-3"
    >
      <form.Field
        name="email-or-username"
        listeners={{
          onChangeDebounceMs: 250,
        }}
        children={(field) => {
          const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid
          const isEmail = (field.state.value || "").includes('@')

          return (
            <Field data-invalid={isInvalid}>
              <InputGroup>
                <InputGroupAddon align="inline-start">
                  {
                    isEmail ? <MailIcon /> : <UserCircle2Icon />
                  }
                </InputGroupAddon>
                <InputGroupInput
                  id={field.name}
                  name={field.name}
                  placeholder="Почта или имя пользователя"
                  value={field.state.value}
                  aria-invalid={isInvalid}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
              </InputGroup>
              {isInvalid && <FieldError errors={field.state.meta.errors} />}
            </Field>
          )
        }}
      />
      <form.Field
        name="password"
        listeners={{
          onChangeDebounceMs: 250,
        }}
        children={(field) => {

          const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid

          return (
            <Field data-invalid={isInvalid}>
              <InputGroup>
                <InputGroupAddon align="inline-start">
                  <KeyIcon />
                </InputGroupAddon>
                <InputGroupInput
                  id={field.name}
                  name={field.name}
                  type={showPassword ? "text" : "password"}
                  placeholder="******"
                  value={field.state.value}
                  aria-invalid={isInvalid}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
                <InputGroupButton onClick={() => setShowPassword(!showPassword)}>
                  {
                    showPassword ? <EyeIcon /> : <EyeClosedIcon />
                  }
                </InputGroupButton>
              </InputGroup>
              {isInvalid && <FieldError errors={field.state.meta.errors} />}
            </Field>
          )
        }}
      />
      <div className="py-3">
        <Button type="submit" form="signin-form" className="w-full" disabled={disabled}>
          {loading && <Spinner />}
          <span>Продолжить</span>
        </Button>
      </div>
    </form >
  )
}
