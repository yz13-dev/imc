import { ImcIcon } from "@workspace/ui/components/logo/imc";
import Header, { HeaderContent } from "./header";
import UserDropdown from "./user-dropdown";

type Props = {
  children?: React.ReactNode
}
export default function DefaultHeader({ children }: Props) {
  return (
    <Header>
      <HeaderContent>
        <ImcIcon className="size-6" />
      </HeaderContent>
      {children}
      <HeaderContent>
        <UserDropdown />
      </HeaderContent>
    </Header>
  )
}
