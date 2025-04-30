import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import NewPost from './pages/NewPost';
import Topic from './pages/Topic';

function App() {
  const isAuthenticated = !!localStorage.getItem('token');

  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={isAuthenticated ? <Navigate to="/" /> : <Login />} />
      <Route path="/register" element={isAuthenticated ? <Navigate to="/" /> : <Register />} />
      <Route path="/newpost" element={isAuthenticated ? <NewPost /> : <Navigate to="/login" />} />
      <Route path="/topic/:id" element={<Topic />} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default App;
