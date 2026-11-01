import { AuthProvider, useAuth } from "./auth/AuthContext.tsx";
import LoginForm from "./components/LoginForm.tsx";
import "./App.css";

function Home() {
  const { user, loading, logout } = useAuth();

  if (loading) return <p className="status">Cargando…</p>;
  if (!user) return <LoginForm />;

  return (
    <section className="account">
      <h1>Hola, {user.fullName ?? user.email}</h1>
      <p>{user.email}</p>
      <button type="button" onClick={() => void logout()}>
        Cerrar sesión
      </button>
    </section>
  );
}

function App() {
  return (
    <AuthProvider>
      <main>
        <Home />
      </main>
    </AuthProvider>
  );
}

export default App;
