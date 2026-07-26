import { ImcWithTextIcon } from "@workspace/ui/components/logo/imc";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Политика конфиденциальности | IMC",
  description: "Политика конфиденциальности IMC и расширения IMC для браузера.",
};

const UPDATED_AT = "26 июля 2026";

export default function Page() {
  return (
    <>
      <header className="w-full h-14">
        <div className="container border-x px-6 w-full mx-auto h-full flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <ImcWithTextIcon className="w-fit h-7" />
          </Link>
        </div>
      </header>
      <main className="border-t">
        <div className="container mx-auto border-x px-6 py-16 max-w-3xl">
          <h1 className="text-4xl font-medium mb-2">
            Политика <span className="font-serif italic">конфиденциальности</span>
          </h1>
          <p className="text-sm text-muted-foreground mb-10">
            Обновлено {UPDATED_AT}
          </p>

          <div className="flex flex-col gap-8 text-base leading-relaxed">
            <section className="flex flex-col gap-2">
              <p>
                Эта политика описывает, какие данные собирает и обрабатывает IMC —
                веб-приложение на <code>imc.yz13.dev</code> и одноимённое браузерное
                расширение. Она распространяется на оба продукта, так как расширение
                работает как клиент к тому же API.
              </p>
            </section>

            <section className="flex flex-col gap-2">
              <h2 className="text-xl font-medium">Кто обрабатывает данные</h2>
              <p>
                Разработчик и оператор сервиса — yz13. По вопросам, связанным с этой
                политикой или вашими данными, можно написать на{" "}
                <a className="underline underline-offset-2" href="mailto:yz13.dev@gmail.com">
                  yz13.dev@gmail.com
                </a>.
              </p>
            </section>

            <section className="flex flex-col gap-2">
              <h2 className="text-xl font-medium">Какие данные мы собираем</h2>
              <p>Мы собираем только то, что нужно для работы сервиса:</p>
              <ul className="list-disc pl-6 flex flex-col gap-1">
                <li>
                  <b>Данные аккаунта</b> — email и данные, которые вы предоставляете при
                  регистрации/входе.
                </li>
                <li>
                  <b>Сохранённый контент</b> — изображения, gif и видео, которые вы сохраняете
                  через веб-приложение или расширение.
                </li>
                <li>
                  <b>Данные источника</b> — заголовок страницы, URL и favicon сайта, с
                  которого вы сохранили контент через расширение. Это нужно, чтобы
                  привязать сохранённое к источнику и отобразить его в вашем дашборде.
                </li>
                <li>
                  <b>Токен авторизации</b> — хранится локально в защищённом хранилище
                  расширения (<code>browser.storage.local</code>) и используется только
                  для подтверждения вашей личности при обращении к API IMC.
                </li>
              </ul>
              <p>
                Расширение <b>не отслеживает</b> вашу историю браузера, не собирает контент
                со страниц, которые вы не сохраняете сами, и не работает в фоне без вашего
                действия — данные о странице считываются только в момент, когда вы явно
                нажимаете «Сохранить в IMC» в контекстном меню.
              </p>
            </section>

            <section className="flex flex-col gap-2">
              <h2 className="text-xl font-medium">Как мы используем данные</h2>
              <p>
                Собранные данные используются исключительно для основной функции сервиса:
                сохранения, хранения и организации вашего контента и его источников в
                вашем личном аккаунте IMC. Мы не используем эти данные для рекламы,
                профилирования, кредитных или иных решений, а также не продаём их.
              </p>
            </section>

            <section className="flex flex-col gap-2">
              <h2 className="text-xl font-medium">Передача данных третьим лицам</h2>
              <p>
                Мы не передаём и не продаём ваши данные третьим лицам. Все запросы
                расширения идут напрямую на наш собственный API (
                <code>api.imc.yz13.dev</code>) по HTTPS — данные не проходят через
                сторонние сервисы аналитики, рекламы или трекинга.
              </p>
            </section>

            <section className="flex flex-col gap-2">
              <h2 className="text-xl font-medium">Хранение и удаление данных</h2>
              <p>
                Данные хранятся на серверах IMC до тех пор, пока вы не удалите
                соответствующий контент или аккаунт. Чтобы удалить аккаунт и связанные с
                ним данные, напишите на{" "}
                <a className="underline underline-offset-2" href="mailto:yz13.dev@gmail.com">
                  yz13.dev@gmail.com
                </a>{" "}
                — мы удалим их в разумный срок.
              </p>
            </section>

            <section className="flex flex-col gap-2">
              <h2 className="text-xl font-medium">Безопасность</h2>
              <p>
                Токен авторизации передаётся только на домены IMC по HTTPS и хранится
                локально в браузере. Доступ к API защищён авторизацией по токену.
              </p>
            </section>

            <section className="flex flex-col gap-2">
              <h2 className="text-xl font-medium">Дети</h2>
              <p>
                Сервис не предназначен для лиц младше 13 лет, и мы сознательно не
                собираем данные детей.
              </p>
            </section>

            <section className="flex flex-col gap-2">
              <h2 className="text-xl font-medium">Изменения политики</h2>
              <p>
                При изменении этой политики дата в начале страницы будет обновлена. Если
                изменения будут существенными, мы постараемся уведомить об этом в
                интерфейсе сервиса.
              </p>
            </section>
          </div>
        </div>
      </main>
      <div className="w-full h-16 border-t" />
    </>
  );
}
