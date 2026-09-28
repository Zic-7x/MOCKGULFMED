import React, { useState, useEffect } from 'react';

export default function FloatingNavIsland() {
  const [visible, setVisible] = useState(false);
  const [activeSection, setActiveSection] = useState('ctg-estimator');

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      setVisible(scrollY > 400);

      const sections = [
        { id: 'ctg-estimator', offset: 0 },
        { id: 'ctg-journey', offset: 0 },
        { id: 'ctg-cbt-demo', offset: 0 },
        { id: 'ctg-catalog', offset: 0 },
        { id: 'ctg-stories', offset: 0 },
        { id: 'ctg-faq', offset: 0 },
      ];

      for (let i = sections.length - 1; i >= 0; i--) {
        const el = document.getElementById(sections[i].id);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= 160) {
            setActiveSection(sections[i].id);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (!visible) return null;

  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) {
      const y = el.getBoundingClientRect().top + window.pageYOffset - 90;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  const navItems = [
    { id: 'ctg-estimator', label: 'Fee & Timeline', icon: '⏱️' },
    { id: 'ctg-journey', label: '5-Stage Path', icon: '🧭' },
    { id: 'ctg-cbt-demo', label: 'Try CBT Mock', icon: '📝' },
    { id: 'ctg-catalog', label: 'Exam Banks', icon: '📚' },
    { id: 'ctg-stories', label: 'Verified Passes', icon: '⭐' },
    { id: 'ctg-faq', label: 'FAQs', icon: '❓' },
  ];

  return (
    <aside className="ctg-floating-island" aria-label="Contextual Quick Navigation">
      <div className="ctg-floating-island-inner">
        {navItems.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`ctg-island-btn ${activeSection === item.id ? 'ctg-island-btn--active' : ''}`}
            onClick={() => scrollTo(item.id)}
          >
            <span className="ctg-island-icon">{item.icon}</span>
            <span className="ctg-island-label">{item.label}</span>
          </button>
        ))}
      </div>
    </aside>
  );
}
