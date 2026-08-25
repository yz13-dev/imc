import { ImcIcon } from "@workspace/ui/components/logo/imc";
import Header, { HeaderContent } from "./header";
import UserDropdown from "./user-dropdown";

type Props = {
  children?: React.ReactNode
}
export default function DefaultHeader({ children }: Props) {
  return (
    <Header
      style={{ "--header-section-min-width": "125px" } as React.CSSProperties}
      className="gap-3"
    >
      <HeaderContent className="justify-start md:min-w-(--header-section-min-width)">
        <ImcIcon className="size-6" />
      </HeaderContent>
      <HeaderContent className="justify-start w-full">
        {children}
      </HeaderContent>
      <HeaderContent className="justify-end md:min-w-(--header-section-min-width)">
        <UserDropdown />
      </HeaderContent>
    </Header>
  )
}
