const express = require('express');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');
const multer = require('multer');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');

const app = express();
const PORT = 3000;
const DATA_DIR = path.join(__dirname, 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const POSTS_FILE = path.join(DATA_DIR, 'posts.json');
const UPLOADS_DIR = path.join(__dirname, 'public', 'uploads');
const SECRET_KEY = 'your_secret_key_here'; // Change this to a secure key in production

// Ensure uploads directory exists
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, UPLOADS_DIR);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});
const upload = multer({ storage: storage });

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Utility functions to read and write JSON files
function readJSON(file) {
  if (!fs.existsSync(file)) {
    fs.writeFileSync(file, '[]', 'utf8');
  }
  const data = fs.readFileSync(file, 'utf8');
  return JSON.parse(data);
}

function writeJSON(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');
}

// User registration
app.post('/api/register', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required' });
  }
  const users = readJSON(USERS_FILE);
  if (users.find(u => u.username === username)) {
    return res.status(400).json({ message: 'Username already exists' });
  }
  const hashedPassword = await bcrypt.hash(password, 10);
  const newUser = { id: Date.now(), username, password: hashedPassword };
  users.push(newUser);
  writeJSON(USERS_FILE, users);
  res.status(201).json({ message: 'User registered successfully' });
});

// User login
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  const users = readJSON(USERS_FILE);
  const user = users.find(u => u.username === username);
  if (!user) {
    return res.status(400).json({ message: 'Invalid username or password' });
  }
  const match = await bcrypt.compare(password, user.password);
  if (!match) {
    return res.status(400).json({ message: 'Invalid username or password' });
  }
  const token = jwt.sign({ id: user.id, username: user.username }, SECRET_KEY, { expiresIn: '1h' });
  res.json({ token });
});

// Middleware to authenticate token
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.sendStatus(401);
  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
}

// Get all posts
app.get('/api/posts', (req, res) => {
  const posts = readJSON(POSTS_FILE);
  res.json(posts);
});

app.post('/api/posts', authenticateToken, upload.array('files', 5), (req, res) => {
  const { title, content } = req.body;
  if (!title || !content) {
    return res.status(400).json({ message: 'Title and content are required' });
  }
  const posts = readJSON(POSTS_FILE);
  const files = req.files ? req.files.map(file => ({
    filename: file.filename,
    url: '/uploads/' + file.filename,
    mimetype: file.mimetype
  })) : [];
  const newPost = {
    id: Date.now(),
    userId: req.user.id,
    username: req.user.username,
    title,
    content,
    createdAt: new Date(),
    comments: [],
    upvotes: [],
    downvotes: [],
    files
  };
  posts.push(newPost);
  writeJSON(POSTS_FILE, posts);
  res.status(201).json(newPost);
});

// Get a single post by id
app.get('/api/posts/:id', (req, res) => {
  const posts = readJSON(POSTS_FILE);
  const post = posts.find(p => p.id === parseInt(req.params.id));
  if (!post) {
    return res.status(404).json({ message: 'Post not found' });
  }
  res.json(post);
});

app.post('/api/posts/:id/comments', authenticateToken, upload.array('files', 5), (req, res) => {
  const { content, parentId } = req.body;
  if (!content) {
    return res.status(400).json({ message: 'Content is required' });
  }
  const posts = readJSON(POSTS_FILE);
  const post = posts.find(p => p.id === parseInt(req.params.id));
  if (!post) {
    return res.status(404).json({ message: 'Post not found' });
  }
  const files = req.files ? req.files.map(file => ({
    filename: file.filename,
    url: '/uploads/' + file.filename,
    mimetype: file.mimetype
  })) : [];
  const newComment = {
    id: Date.now(),
    userId: req.user.id,
    username: req.user.username,
    content,
    createdAt: new Date(),
    replies: [],
    upvotes: [],
    downvotes: [],
    files
  };
  if (parentId) {
    // Find parent comment recursively and add reply
    function findComment(comments, id) {
      for (let comment of comments) {
        if (comment.id === id) return comment;
        const found = findComment(comment.replies, id);
        if (found) return found;
      }
      return null;
    }
    const parentComment = findComment(post.comments, parentId);
    if (!parentComment) {
      return res.status(400).json({ message: 'Parent comment not found' });
    }
    parentComment.replies.push(newComment);
  } else {
    post.comments.push(newComment);
  }
  writeJSON(POSTS_FILE, posts);
  res.status(201).json(newComment);
});

// Vote on a post or comment (authenticated)
app.post('/api/vote', authenticateToken, (req, res) => {
  const { postId, commentId, vote } = req.body; // vote: +1 or -1
  if (!postId || ![1, -1].includes(vote)) {
    return res.status(400).json({ message: 'Invalid vote data' });
  }
  const posts = readJSON(POSTS_FILE);
  const post = posts.find(p => p.id === parseInt(postId));
  if (!post) {
    return res.status(404).json({ message: 'Post not found' });
  }

  function removeUserFromVotes(votesArray, userId) {
    const index = votesArray.indexOf(userId);
    if (index !== -1) {
      votesArray.splice(index, 1);
    }
  }

  if (!commentId) {
    // Vote on post
    post.upvotes = post.upvotes || [];
    post.downvotes = post.downvotes || [];
    // Remove user from both arrays first
    removeUserFromVotes(post.upvotes, req.user.id);
    removeUserFromVotes(post.downvotes, req.user.id);
    // Add user to the appropriate array
    if (vote === 1) {
      post.upvotes.push(req.user.id);
    } else if (vote === -1) {
      post.downvotes.push(req.user.id);
    }
  } else {
    // Vote on comment
    function findComment(comments, id) {
      for (let comment of comments) {
        if (comment.id === id) return comment;
        const found = findComment(comment.replies, id);
        if (found) return found;
      }
      return null;
    }
    const comment = findComment(post.comments, commentId);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }
    comment.upvotes = comment.upvotes || [];
    comment.downvotes = comment.downvotes || [];
    removeUserFromVotes(comment.upvotes, req.user.id);
    removeUserFromVotes(comment.downvotes, req.user.id);
    if (vote === 1) {
      comment.upvotes.push(req.user.id);
    } else if (vote === -1) {
      comment.downvotes.push(req.user.id);
    }
  }
  writeJSON(POSTS_FILE, posts);
  res.json({ message: 'Vote recorded' });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
