import { Button } from "@workspace/ui/components/button";
import { ImcIcon, ImcWithTextIcon } from "@workspace/ui/components/logo/imc";
import Image from "next/image";

export default function Page() {
  return (
    <>
      <header className="w-full px-6 h-12 py-2">
        <div className="container w-full mx-auto h-full flex items-center">
          <ImcWithTextIcon className="w-fit h-6" />
        </div>
      </header>
      <main className="px-6">
        <div className="container mx-auto py-24">
          <div className="flex items-center justify-between gap-4">
            <h1 className="text-6xl font-medium max-w-2xl">
              Храните свои вдохновления здесь
            </h1>
            <div className="flex flex-col max-w-xs gap-4">
              <p className="text-lg text-muted-foreground">
                Без лимитов хранилища, коллекций. Просто и удобно.
              </p>
              <Button
                size="lg"
                className="h-12 px-6 text-base gap-3"
              >
                <ImcIcon className="size-6 **:fill-background" />
                <span>Начать коллекцию</span>
              </Button>
            </div>
          </div>
        </div>
        <div className="container mx-auto">
          <div className="w-full aspect-video relative drop-shadow-2xl outline-8 border outline-offset-2 outline-secondary rounded-2xl [&_img]:rounded-2xl bg-muted">
            <Image src="/hero/demo-shot.png" fill alt="Demo shot" />
          </div>
        </div>
      </main>

    </>
  )
}
