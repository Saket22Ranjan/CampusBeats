import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Chat from "./pages/Chat";
import Profile from "./pages/Profile";

export default function App() {
  const auth = useAuth();
  if (!auth) return null;

  const { user } = auth;

  return (
    <BrowserRouter>
      <Routes>
        {/* NOT LOGGED IN */}
        {!user && (
          <>
            <Route path="/" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="*" element={<Navigate to="/" />} />
          </>
        )}

        {/* LOGGED IN BUT PROFILE INCOMPLETE */}
        {user && !user.isProfileComplete && (
          <>
            <Route path="/profile" element={<Profile />} />
            <Route path="*" element={<Navigate to="/profile" />} />
          </>
        )}

        {/* LOGGED IN + PROFILE COMPLETE */}
        {user && user.isProfileComplete && (
          <>
            <Route path="/chat" element={<Chat />} />
            <Route path="*" element={<Navigate to="/chat" />} />
          </>
        )}
      </Routes>
    </BrowserRouter>
  );
}
