type PublicLayoutProps = {
  children: React.ReactNode
  modal: React.ReactNode
}

export default function PublicLayout({ children, modal }: PublicLayoutProps) {
  return (
    <>
      {children}
      {modal}
    </>
  )
}
