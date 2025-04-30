import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

function Topic() {
  const { id } = useParams();
  const [post, setPost] = useState(null);
  const [commentContent, setCommentContent] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const navigate = useNavigate();

  const token = localStorage.getItem('token');

  useEffect(() => {
    axios.get(`/api/posts/${id}`)
      .then(res => setPost(res.data))
      .catch(() => setPost(null));
  }, [id]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    if (!commentContent.trim()) return;

    try {
      const res = await axios.post(`/api/posts/${id}/comments`, { content: commentContent }, {
        headers: { Authorization: 'Bearer ' + token }
      });
      setSuccessMsg('Comment posted successfully!');
      setCommentContent('');
      // Refresh post to update comments
      const updatedPost = await axios.get(`/api/posts/${id}`);
      setPost(updatedPost.data);
    } catch (error) {
      setErrorMsg(error.response?.data?.message || 'Failed to post comment');
    }
  };

  if (post === null) {
    return (
      <div className="max-w-4xl mx-auto p-4">
        <p className="text-red-600">Post not found.</p>
        <Link to="/" className="text-blue-600 hover:underline">Back to Home</Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      <header className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Topic</h1>
        <nav>
          <Link to="/" className="text-blue-600 hover:underline mr-4">Home</Link>
          {token ? (
            <button onClick={handleLogout} className="text-blue-600 hover:underline">Logout</button>
          ) : (
            <Link to="/login" className="text-blue-600 hover:underline">Login</Link>
          )}
        </nav>
      </header>
      {post && (
        <>
          <article className="mb-8 bg-white p-6 rounded shadow">
            <h2 className="text-2xl font-bold mb-2">{post.title}</h2>
            <p className="text-gray-700 mb-4">{post.content}</p>
            <p className="text-gray-500 text-sm">By {post.username} on {new Date(post.createdAt).toLocaleString()}</p>
          </article>
          <section>
            <h2 className="text-xl font-semibold mb-4">Comments</h2>
            <div className="space-y-4 mb-6">
              {post.comments.length === 0 ? (
                <p className="text-gray-600">No comments yet.</p>
              ) : (
                post.comments.map(comment => (
                  <div key={comment.id} className="border border-gray-300 rounded p-3">
                    <p className="text-gray-800">{comment.content}</p>
                    <p className="text-gray-500 text-sm mt-1">By {comment.username} on {new Date(comment.createdAt).toLocaleString()}</p>
                  </div>
                ))
              )}
            </div>
            {token ? (
              <form onSubmit={handleCommentSubmit} className="space-y-4">
                <textarea
                  rows="4"
                  placeholder="Add a comment..."
                  value={commentContent}
                  onChange={e => setCommentContent(e.target.value)}
                  required
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button type="submit" className="bg-blue-600 text-white py-2 px-6 rounded hover:bg-blue-700 transition">Post Comment</button>
                {errorMsg && <p className="text-red-600 mt-2">{errorMsg}</p>}
                {successMsg && <p className="text-green-600 mt-2">{successMsg}</p>}
              </form>
            ) : (
              <p className="text-gray-600">Please <Link to="/login" className="text-blue-600 hover:underline">login</Link> to post comments.</p>
            )}
          </section>
        </>
      )}
    </div>
  );
}

export default Topic;
