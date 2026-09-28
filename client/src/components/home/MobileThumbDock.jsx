import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

export default function MobileThumbDock() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShow(window.scrollY > 350);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (!show) return null;

  return (
    <div className="ctg-mobile-thumb-dock" aria-label="Quick Action Bar">
      <div className="ctg-thumb-dock-inner">
        <Link to="/eligibility-check" className="ctg-thumb-btn ctg-thumb-btn--primary">
          <span>📋</span> Free Eligibility Check
        </Link>
        <Link to="/exams-portal" className="ctg-thumb-btn ctg-thumb-btn--blue">
          <span>🩺</span> Try Exam Mocks
        </Link>
      </div>
    </div>
  );
}
