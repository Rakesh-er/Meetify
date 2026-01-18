import React, { useState } from "react";
import "../App.css";
import { Link, useNavigate } from "react-router-dom";

export default function LandingPage() {
  const router = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div className="landing-container">
      {/* 1. Background Image
         Using 'fixed' positioning in CSS allows this to stay static
         while the rest of the page scrolls.
      */}
      <img src="/background.png" alt="Background" className="main-background" />

      {/* 2. Overlay for Text Readability */}
      <div className="bg-overlay"></div>

      {/* Navigation */}
      <nav className="navbar">
        <div className="nav-content">
          <h2 className="logo">Meetify</h2>

          <div
            className="mobile-toggle"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <span className={isMenuOpen ? "bar open" : "bar"}></span>
            <span className={isMenuOpen ? "bar open" : "bar"}></span>
            <span className={isMenuOpen ? "bar open" : "bar"}></span>
          </div>

          <div className={`nav-links ${isMenuOpen ? "active" : ""}`}>
            <button
              className="btn-text"
              onClick={() => router("/Random-room-connected")}
            >
              Join as Guest
            </button>
            <Link to="/auth" className="btn-outline">
              Sign Up
            </Link>
            <Link to="/auth" className="btn-primary">
              Log In
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Content */}
      <main className="hero-section">
        <div className="hero-content">
          <div className="text-wrapper">
            <h1 className="hero-title">
              <span className="highlight">Connect</span> seamlessly with anyone,
              anywhere.
            </h1>
            <p className="hero-subtitle">
              Experience crystal clear video calls, instant sharing, and secure
              collaboration. No downloads required.
            </p>

            <div className="cta-group">
              <Link to="/auth" className="btn-lg-primary">
                Get Started
              </Link>
              <button
                className="btn-lg-outline"
                onClick={() => router("/home")}
              >
                Explore
              </button>
            </div>

            <ul className="feature-list">
              <li>⚡ Fast Performance</li>
              <li>🔒 Secure Encryption</li>
              <li>📱 Mobile Friendly</li>
            </ul>
          </div>
        </div>

        <div className="hero-image-wrapper">
          <div className="image-card">
            <img src="/mobile.png" alt="App Preview" className="hero-img" />
            {/* Static Badge */}
            <div className="static-badge">
              <span className="dot"></span> Live Meeting
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
