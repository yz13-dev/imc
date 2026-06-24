
type HeaderProps = {
  children?: React.ReactNode
}

export function HeaderContent({ children }: HeaderProps) {
  return (
    <div className="flex items-center h-9 gap-2">{children}</div>
  )
}

export default function Header({ children }: HeaderProps) {


  return (
    <header className="h-14 bg-background/90 backdrop-blur-md sticky top-0 py-2 px-6 z-20 flex items-center justify-between">
      {children}
    </header>
  )
}
