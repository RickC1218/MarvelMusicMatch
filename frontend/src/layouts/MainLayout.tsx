

const MainLayout = ({ children }: { children: React.ReactNode }) =>{
  return (
    <div className="min-h-screen flex flex-col bg-background text-primary font-poppins">
      <main className="flex-grow">{children}</main>
    </div>
  )
}

export default MainLayout