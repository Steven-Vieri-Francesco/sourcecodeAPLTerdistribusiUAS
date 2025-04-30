import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

function NewPost() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const navigate = useNavigate();

  const token = localStorage.getItem('token');
  if (!token) {
    navigate('/login');
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const res = await axios.post('/api/posts', { title, content }, {
        headers: { Authorization: 'Bearer ' + token }
      });
      setSuccessMsg('Post created successfully!');
      setTitle('');
      setContent('');
      setTimeout(() => {
        navigate('/');
      }, 2000);
    } catch (error) {
      setErrorMsg(error.response?.data?.message || 'Failed to create post');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <header className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">New Post</h1>
        <nav>
          <Link to="/" className="text-blue-600 hover:underline mr-4">Home</Link>
          <button onClick={handleLogout} className="text-blue-600 hover:underline">Logout</button>
        </nav>
      </header>
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow-md space-y-4">
        <div>
          <label htmlFor="title" className="block text-gray-700 font-semibold mb-1">Title</label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            required
            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label htmlFor="content" className="block text-gray-700 font-semibold mb-1">Content</label>
          <textarea
            id="content"
            rows="8"
            value={content}
            onChange={e => setContent(e.target.value)}
            required
            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <button type="submit" className="bg-blue-600 text-white py-2 px-6 rounded hover:bg-blue-700 transition">Create Post</button>
        {errorMsg && <p className="text-red-600 mt-2">{errorMsg}</p>}
        {successMsg && <p className="text-green-600 mt-2">{successMsg}</p>}
      </form>
    </div>
  );
}

export default NewPost;
