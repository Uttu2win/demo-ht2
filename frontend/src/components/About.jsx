import React from 'react';
import { useNavigate } from 'react-router-dom';
import './About.css';

const About = () => {
  const navigate = useNavigate();

  const cards = [
    { id: 1, image: 'https://via.placeholder.com/150', text: 'Connect with neighbors.' },
    { id: 2, image: 'https://via.placeholder.com/150', text: 'Host community events.' },
    { id: 3, image: 'https://via.placeholder.com/150', text: 'Help others in need.' },
    { id: 4, image: 'https://via.placeholder.com/150', text: 'Create a safer community.' },
    { id: 5, image: 'https://via.placeholder.com/150', text: 'Foster community engagement.' },
    { id: 6, image: 'https://via.placeholder.com/150', text: 'Promote sustainable practices.' },
  ];

  return (
    <div className="about-section">
      <h2 className="about-heading">About HandsTogether</h2>
      <div className="card-container">
        {cards.map((card) => (
          <div key={card.id} className="card">
            <img src={card.image} alt="About" />
            <p>{card.text}</p>
          </div>
        ))}
      </div>
      <button onClick={() => navigate('/auth')} className="ok-button">
        OK
      </button>
    </div>
  );
};

export default About;
