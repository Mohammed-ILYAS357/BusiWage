// Root component. Wraps the whole app in the Router and the DataProvider,
// then shows the right page via AppRoutes.
import { BrowserRouter } from 'react-router-dom'
import { DataProvider } from './context/DataContext'
import { ThemeProvider, useTheme } from './context/ThemeContext'
import AppRoutes from './routes/AppRoutes'
import './styles/global.css'

// Separate inner component so it can read the theme from context.
function ThemedShell() {
  const { theme } = useTheme()
  return (
    <div className="app-shell" data-theme={theme}>
      <AppRoutes />
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <DataProvider>
          <ThemedShell />
        </DataProvider>
      </ThemeProvider>
    </BrowserRouter>
  )
}