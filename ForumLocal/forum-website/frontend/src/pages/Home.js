import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

function Home() {
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    axios.get('/api/posts')
      .then(res => setPosts(res.data))
      .catch(err => console.error(err));
  }, []);

  return (
    <div className="max-w-4xl mx-auto p-4">
      <header className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Forum</h1>
        <nav>
          <Link to="/login" className="text-blue-600 hover:underline mr-4">Login</Link>
          <Link to="/register" className="text-blue-600 hover:underline mr-4">Register</Link>
          <Link to="/newpost" className="text-blue-600 hover:underline">New Post</Link>
        </nav>
      </header>
      <h2 className="text-xl font-semibold mb-4">Topics</h2>
      <div className="space-y-4">
        {posts.length === 0 ? (
          <p className="text-gray-600">No topics yet. Be the first to create one!</p>
        ) : (
          posts.map(post => (
            <div key={post.id} className="bg-white p-4 rounded shadow hover:shadow-md transition-shadow">
              <Link to={`/topic/${post.id}`} className="text-lg font-semibold text-blue-600 hover:underline">
                {post.title}
              </Link>
              <p className="text-gray-700 mt-1">{post.content.substring(0, 100)}{post.content.length > 100 ? '...' : ''}</p>
              <p className="text-gray-500 text-sm mt-2">By {post.username} on {new Date(post.createdAt).toLocaleString()}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default Home;
