import { RoleModeProvider } from "./context/RoleModeContext"
import AppRoutes from "./routes/AppRoutes"

function App() {
  return (
    <RoleModeProvider>
      <AppRoutes />
    </RoleModeProvider>
  )
}

export default App;