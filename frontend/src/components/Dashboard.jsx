import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPost, fetchPosts, likePost } from '../services/api.js';
import PostConfirmationModal from './PostConfirmationModal.jsx';
import ForSaleFree from './ForSaleFree/ForSaleFree.jsx';
import Notifications from './Notifications.jsx';
import axios from 'axios';
import { Send, MessageCircle } from 'lucide-react';
import './Dashboard.css';
import { formatTimeAgo } from '../utils/dateUtils.js';

const Dashboard = () => {
  const navigate = useNavigate();
  const [currentView, setCurrentView] = useState('home');
  const [allPosts, setAllPosts] = useState([]); // Store all posts
  const [filteredPosts, setFilteredPosts] = useState([]); // Store filtered posts
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [pendingPost, setPendingPost] = useState(null);
  const [user, setUser] = useState(null);
  const [neighborhood, setNeighborhood] = useState(null);


  // Load user from local storage on component mount
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    
    try {
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
  
        if (parsedUser.neighborhoodId) {
          const fetchNeighborhoodDetails = async () => {
            try {
              const response = await axios.get(
                `http://localhost:8000/api/neighborhoods/${parsedUser.neighborhoodId}`,
                {
                  headers: { 
                    Authorization: `Bearer ${storedToken}` 
                  }
                }
              );
              setNeighborhood(response.data);
            } catch (error) {
              console.error('Error fetching neighborhood:', error);
              // Handle the error gracefully without breaking the UI
              setNeighborhood(null);
            }
          };
  
          fetchNeighborhoodDetails();
        }
      }
    } catch (error) {
      console.error('Error parsing stored user:', error);
      // Handle invalid stored data
      localStorage.removeItem('user');
      navigate('/login');
    }
  }, []);

  useEffect(() => {
    if (currentView === 'home') {
      const loadPosts = async () => {
        try {
          setIsLoading(true);
          const response = await fetchPosts();
          const postsData = Array.isArray(response.data) ? response.data : [];
          setAllPosts(postsData);
          setFilteredPosts(postsData); // Initialize filtered posts with all posts
          setError(null);
        } catch (error) {
          console.error('Error fetching posts:', error);
          setAllPosts([]);
          setFilteredPosts([]);
          setError('Failed to fetch posts. Please try logging in again.');
          if (error.response?.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            navigate('/login');
          }
        } finally {
          setIsLoading(false);
        }
      };

      loadPosts();
    }
  }, [currentView, navigate]);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredPosts(allPosts);
    } else {
      const lowercaseSearch = searchTerm.toLowerCase();
      const filtered = allPosts.filter(post => 
        (post.title?.toLowerCase().includes(lowercaseSearch) ||
        post.content?.toLowerCase().includes(lowercaseSearch) ||
        post.category?.toLowerCase().includes(lowercaseSearch) ||
        post.createdBy?.name?.toLowerCase().includes(lowercaseSearch))
      );
      setFilteredPosts(filtered);
    }
  }, [searchTerm, allPosts]);

// const handleSearchChange = (e) => {
//   const query = e.target.value.toLowerCase();
//   setSearchQuery(query);
  
//   // Filter posts based on title or username
//   const filtered = posts.filter(post => 
//     post.title.toLowerCase().includes(query) || 
//     post.createdBy.name.toLowerCase().includes(query)
//   );
//   setFilteredPosts(filtered);
// };


const handleCreatePost = async (e) => {
  e.preventDefault();
  const formData = new FormData(e.target);
  const postData = {
    title: formData.get('title'),
    content: formData.get('content'),
    category: formData.get('category'),
    imageUrl: formData.get('imageUrl') || ''
  };

  setPendingPost(postData);
  setIsModalOpen(true);
};

const confirmPost = async () => {
  if (!pendingPost) return;

  try {
    const response = await createPost(pendingPost);
    
    if (currentView === 'home') {
      setAllPosts(prevPosts => [response.data, ...prevPosts]);
      setFilteredPosts(prevPosts => [response.data, ...prevPosts]);
    }
    
    setCurrentView('home');
    setIsModalOpen(false);
    setPendingPost(null);
  } catch (error) {
    console.error('Error creating post:', error);
    alert('Failed to create post. Please try again.');
  }
};

  
const handleLikePost = async (postId) => {
  const token = localStorage.getItem('token');
  const storedUser = localStorage.getItem('user');
  
  if (!token) {
    alert('Please log in to like posts');
    return;
  }

  let currentUser;
  try {
    currentUser = storedUser ? JSON.parse(storedUser) : null;
  } catch (error) {
    console.error('Error parsing stored user:', error);
    alert('Error retrieving user information');
    return;
  }

  if (!currentUser) {
    alert('User information not found. Please log in again.');
    return;
  }

  try {
    const response = await likePost(postId);
    
    if (response && response.data) {
      const updatePosts = posts => 
        posts.map(post => 
          post._id === postId ? {
            ...post, 
            likes: response.data.likes || [] 
          } : post
        );
      
      setAllPosts(updatePosts);
      setFilteredPosts(updatePosts);
    }
  } catch (error) {
    console.error('Detailed like error:', error.response ? error.response.data : error);
    alert(
      error.response?.data?.message || 
      'Failed to like/unlike the post. Please try again.'
    );
  }
};
  
  

  const handleAddComment = async (postId, commentText) => {
    try {
      const response = await axios.post(`http://localhost:8000/api/posts/${postId}/comment`, 
        { text: commentText }, 
        {
          headers: { 
            Authorization: `Bearer ${localStorage.getItem('token')}` 
          }
        }
      );

      // Update the posts list with the updated post
      setPosts(prevPosts => 
        prevPosts.map(post => 
          post._id === postId ? response.data : post
        )
      );
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const renderSidebarButtons = () => {
    const buttons = [
      { view: 'home', label: 'Home' },
      { view: 'notifications', label: 'Notifications' },
      { view: 'chats', label: 'Chats' },
      { view: 'forsalefree', label: 'For Sale & Free' },
      { view: 'post', label: 'Post' },
      
    ];

    return buttons.map(button => (
      <button 
        key={button.view}
        onClick={() => setCurrentView(button.view)}
        className={currentView === button.view ? 'active' : ''}
      >
        {button.label}
      </button>
    ));
  };

  const PostCard = ({ post }) => {
    const [showFullContent, setShowFullContent] = useState(false);
    const [showComments, setShowComments] = useState(false);
    const [newComment, setNewComment] = useState('');
  
    const MAX_CONTENT_LENGTH = 200;
  
    const toggleContent = () => setShowFullContent(!showFullContent);
    const toggleComments = () => setShowComments(!showComments);

    const handleCommentSubmit = async () => {
      if (!newComment.trim()) return;
  
      try {
        await handleAddComment(post._id, newComment);
        setNewComment(''); // Clear the input after successful submission
      } catch (error) {
        console.error('Error submitting comment:', error);
      }
    };
  
    const renderContent = () => {
      if (showFullContent || post.content.length <= MAX_CONTENT_LENGTH) {
        return post.content;
      }
      return `${post.content.substring(0, MAX_CONTENT_LENGTH)}...`;
    };
  
    // Add null checks for post and nested objects
    if (!post || !post.createdBy) {
      return null; // or a placeholder/error component
    }
  
    return (
      <div className="post-card">
        {/* User info and timestamp */}
        <div className="post-header">
          <img 
            src={post.createdBy.profilePic || '/default-profile.png'} 
            alt={`${post.createdBy.name || 'Unknown'}'s profile`} 
            className="profile-pic" 
          />
          <div>
            <span className="post-author">{post.createdBy.name || 'Unknown User'}</span>
            <span className="post-timestamp">
              {formatTimeAgo(post.createdAt)}
            </span>
          </div>
        </div>
  
        {/* Post content */}
        <div className="post-content">
          <h3>{post.title || 'Untitled Post'}</h3>
          <p>
            {renderContent()}
            {post.content && post.content.length > MAX_CONTENT_LENGTH && (
              <button 
                onClick={toggleContent} 
                className="see-more-btn"
              >
                {showFullContent ? 'See Less' : 'See More'}
              </button>
            )}
          </p>
  
          {/* Post image */}
          {post.imageUrl && (
            <img 
              src={post.imageUrl} 
              alt={post.title || 'Post Image'} 
              className="post-image" 
            />
          )}
        </div>
  
        {/* Interactions section */}
        <div className="post-interactions">
          <div className="like-section">
            <button 
              onClick={() => handleLikePost(post._id)}
              className="like-btn"
            >
              <span style={{ 
                color: (post.likes && Array.isArray(post.likes) && 
                        user && 
                        post.likes.some(like => 
                          (like._id || like) === user._id
                        )) ? 'red' : 'black' 
              }}>
                👍 {post.likes ? post.likes.length : 0}
              </span>
            </button>
          </div>
        </div>
  
        <div className="post-comments-section">
          {/* Comment input field */}
          <div className="comment-input-container">
            <input 
              type="text"
              placeholder="Write a comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleCommentSubmit()}
            />
            <button 
              onClick={handleCommentSubmit}
              className="comment-send-btn"
            >
              <Send size={20} />
            </button>
          </div>
  
          {/* Comments toggle */}
          <button 
            onClick={() => setShowComments(!showComments)}
            className="view-comments-btn"
          >
            <MessageCircle size={20} /> 
            {post.comments ? post.comments.length : 0} Comments
          </button>
  
          {/* Comments display */}
          {showComments && (
            <div className="comments-list">
              {(post.comments || []).map((comment, index) => (
                <div key={index} className="comment-item">
                  <img 
                    src={(comment.userId?.profilePic) || '/default-profile.png'} 
                    alt={`${comment.userName || 'Unknown'}'s profile`} 
                    className="comment-profile-pic" 
                  />
                  <div className="comment-content">
                    <span className="comment-author">{comment.userName || 'Unknown User'}</span>
                    <p>{comment.text}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };


  const renderContent = () => {
    switch (currentView) {
      case 'home':
        return (
          <div className="home-content">
            <h2>Neighborhood Updates</h2>
            <div className="search-container">
              <input
                type="text"
                placeholder="Search posts..."
                className="search-input"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            {isLoading ? (
              <p>Loading posts...</p>
            ) : error ? (
              <p>Error: {error}</p>
            ) : filteredPosts.length === 0 ? (
              <p>No posts available</p>
            ) : (
              filteredPosts.filter(post => post && post._id).map(post => (
                <PostCard key={post._id} post={post} />
              ))
            )}
          </div>
        );
      case 'forsalefree':
        return <ForSaleFree />/*(
          <div className="home-content">
            <h2>For Sale & Free</h2>
            {isLoading ? (
              <p>Loading posts...</p>
            ) : error ? (
              <p>Error: {error}</p>
            ) : posts.filter(p => p.category === 'ForSaleFree').length === 0 ? (
              <p>No For Sale & Free posts available</p>
            ) : (
              posts
                .filter(p => p.category === 'ForSaleFree')
                .map(post => <PostCard key={post._id} post={post} />)
            )}
          </div>
        );*/
      case 'notifications':
        return <Notifications userId={user?._id} />;
      case 'chats':
        return (
          <div className="chats-content">
            <h2>Neighborhood Chats</h2>
            <p>Chat feature coming soon!</p>
          </div>
        );
      case 'post':
        return (
          <div className="post-content">
            <h2>Create a New Post</h2>
            <form onSubmit={handleCreatePost}>
              <input 
                type="text" 
                placeholder="Post Title" 
                name="title" 
                required 
              />
              <textarea 
                placeholder="What's happening?" 
                name="content" 
                required 
              />
              <select name="category" required>
                <option value="">Select Category</option>
                <option value="Events">Events</option>
                <option value="Announcements">Announcements</option>
                <option value="News">News</option>
                <option value="Sale">Sale</option>
                <option value="ForSaleFree">For Sale & Free</option>
                <option value="LostAndFound">Lost and Found</option>
                <option value="Services">Services</option>
              </select>
              <input 
                type="text" 
                placeholder="Image URL (optional)" 
                name="imageUrl" 
              />
              <button type="submit">Post</button>
            </form>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="dashboard-container">
      {/* Sidebar */}
      <div className="sidebar">
        {renderSidebarButtons()}
        <button onClick={handleLogout}>
          Logout
        </button>
      </div>

      {/* Main Content Area */}
      <div className="main-content">
        {renderContent()}
      </div>

      <PostConfirmationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={confirmPost}
        postDetails={pendingPost || {}}
      />
    </div>
  );
};

export default Dashboard;