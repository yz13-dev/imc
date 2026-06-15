import { Button } from "@workspace/ui/components/button";
import { ImcWithTextIcon } from "@workspace/ui/components/logo/imc";
import { Separator } from "@workspace/ui/components/separator";
import ThemeImage from "@workspace/ui/components/theme-image";
import { ArrowRightIcon, ArrowUpIcon } from "lucide-react";
import Link from "next/link";

export default function Page() {

  return (
    <>
      <header className="w-full h-14">
        <div className="container border-x px-6 w-full mx-auto h-full flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ImcWithTextIcon className="w-fit h-7" />
          </div>
          <div className="flex items-center justify-end gap-2">
            <Button nativeButton={false} render={<Link href="/auth/signin" />}>
              <span>Войти</span>
              <ArrowRightIcon />
            </Button>
          </div>
        </div>
      </header>
      <main className="border-t">
        <div className="relative">
          <div
            style={{ "--pattern-size": "10px" } as React.CSSProperties}
            className="absolute top-0 -z-20 left-0 w-full h-1/2 pattern-dots"
          />
          <div
            style={{ "--pattern-size": "24px" } as React.CSSProperties}
            className="absolute top-1/2 -z-20 left-0 w-full h-1/2 pattern-grid"
          />
          <div className="absolute top-0 -z-10 left-0 size-full bg-linear-to-b from-transparent via-background to-transparent" />
          <div
            className="container mx-auto relative border-x px-6 py-24"
          >
            <div className="flex md:flex-row z-10 flex-col items-center justify-between gap-8">
              <h1 className="md:text-6xl text-5xl font-medium max-w-2xl">
                Храните свои <span className="font-serif italic">вдохновления</span> здесь
              </h1>
              <div className="flex flex-col md:max-w-xs gap-4">
                <p className="text-lg text-muted-foreground">
                  Без лимитов хранилища, коллекций. Просто и удобно.
                </p>
                <Button
                  disabled
                  size="lg"
                  className="h-12 px-6 text-base gap-3"
                >
                  <ArrowUpIcon className="size-6" />
                  <span>Начать коллекцию</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
        <Separator />
        <div className="relative">
          <div className="dark size-full absolute inset-0 bg-linear-to-b from-transparent from-20% via-background/75 to-90% to-background" />
          <div className="container mx-auto p-6 bg-background dark border-x relative">
            <div className="w-full aspect-video relative rounded-md overflow-clip">
              <div className="size-full absolute inset-0 z-10 bg-linear-to-b from-transparent from-20% via-background/75 to-90% to-background" />
              <ThemeImage
                srcLight="/hero/demo-shot.png"
                srcDark="/hero/demo-shot-dark.png"
                fill
                alt="Demo shot"
              />
            </div>
          </div>
        </div>
      </main>
      <footer className="dark bg-background relative">
        <Separator />
        <div className="flex">
          <div className="container shrink-0 mx-auto p-6 border-x">
            <ImcWithTextIcon className="w-full opacity-10" />
          </div>
        </div>
      </footer>

    </>
  )
}
