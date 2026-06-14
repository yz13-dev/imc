import { Button } from "@workspace/ui/components/button";
import { ImcIcon, ImcWithTextIcon } from "@workspace/ui/components/logo/imc";
import { Separator } from "@workspace/ui/components/separator";
import Image from "next/image";

export default function Page() {
  return (
    <>
      <header className="w-full h-12">
        <div className="container border-x px-6 w-full mx-auto h-full flex items-center">
          <ImcWithTextIcon className="w-fit h-6" />
        </div>
      </header>
      <main className="border-t">
        <div className="container mx-auto border-x px-6 py-24">
          <div className="flex md:flex-row flex-col items-center justify-between gap-8">
            <h1 className="md:text-6xl text-5xl font-medium max-w-2xl">
              Храните свои вдохновления здесь
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
                <ImcIcon className="size-6 **:fill-background" />
                <span>Начать коллекцию</span>
              </Button>
            </div>
          </div>
        </div>
        <div className="w-full">
          <Separator />
          <div className="container mx-auto border-x p-6 bg-foreground relative">
            <div className="size-2 rotate-45 absolute -left-1 -top-1 border bg-background" />
            <div className="size-2 rotate-45 absolute -right-1 -top-1 border bg-background" />
            <div className="size-2 rotate-45 absolute -left-1 -bottom-1 border bg-background" />
            <div className="size-2 rotate-45 absolute -right-1 -bottom-1 border bg-background" />
            <div className="w-full aspect-video relative border rounded-md overflow-clip">
              <Image src="/hero/demo-shot.png" fill alt="Demo shot" />
            </div>
          </div>
          <Separator />
        </div>
      </main>
      <footer className="">
        <div className="container mx-auto p-6 border-x">
          <ImcWithTextIcon className="w-full opacity-10" />
        </div>
      </footer>

    </>
  )
}
