import { CssBaseline, ThemeProvider, createTheme } from "@mui/material";
import { AutocompleteInput } from "./components/AutocompleteInput";

const theme = createTheme({
  typography: { fontFamily: '"Inter", "Segoe UI", Roboto, sans-serif' },
  shape: { borderRadius: 12 },
});

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-start justify-center px-4 pt-24">
        <div className="w-full max-w-2xl">
          <header className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Autocomplete</h1>
            <p className="mt-2 text-sm text-gray-500">
              Word completions appear as you type. End with a space for sentence completions.
            </p>
          </header>
          <AutocompleteInput />
        </div>
      </div>
    </ThemeProvider>
  );
}
