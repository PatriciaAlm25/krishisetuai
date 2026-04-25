import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { SCHEMES } from '../../data/schemes';
import './ActionGuide.css';

const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY;

export default function ActionGuide() {
  const [selectedScheme, setSelectedScheme] = useState(null);
  const [guideSteps, setGuideSteps] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentLang, setCurrentLang] = useState('en');
  const location = useLocation();

  useEffect(() => {
    if (location.state && location.state.schemeId) {
      const scheme = SCHEMES.find(s => s.id === location.state.schemeId);
      if (scheme) {
        handleGetGuide(scheme, 'en');
      }
    }
  }, [location.state]);

  const handleGetGuide = async (scheme, lang) => {
    setLoading(true);
    setSelectedScheme(scheme);
    setCurrentLang(lang);
    setGuideSteps('');

    try {
      const prompt = `
        Provide a clear, step-by-step application guide for the following government scheme for an Indian farmer who prefers ${lang === 'hi' ? 'Hindi' : 'English'}.
        Break it down into simple numbered steps:
        1. Documents required.
        2. Where to apply (online/offline).
        3. Step-by-step process.
        4. Who to contact for help.
        
        Scheme Name: ${scheme.name}
        Official Link: ${scheme.link}
        
        ${lang === 'hi' ? 'Provide the response in Hindi only.' : 'Provide the response in English only.'}
        Make the steps very actionable and easy to follow.
      `;

      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
          "HTTP-Referer": window.location.origin,
          "X-Title": "KrishiSetu",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          "model": "google/gemini-2.0-flash-001",
          "messages": [{ "role": "user", "content": prompt }]
        })
      });

      const data = await response.json();
      setGuideSteps(data.choices[0].message.content);
    } catch (err) {
      console.error("Action Guide Error:", err);
      setGuideSteps("Sorry, I couldn't generate the action guide right now. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="action-guide-page">
      <div className="container">
        <header className="guide-header">
          <h1>📌 AI Action Guide</h1>
          <p>Step-by-step application help for any government scheme</p>
        </header>

        <div className="guide-layout">
          {/* Sidebar: Scheme List */}
          <div className="scheme-sidebar">
            <h3>Select a Scheme</h3>
            <div className="scheme-list">
              {SCHEMES.map(s => (
                <button 
                  key={s.id} 
                  className={`scheme-select-btn ${selectedScheme?.id === s.id ? 'active' : ''}`}
                  onClick={() => handleGetGuide(s, 'en')}
                >
                  {s.name}
                </button>
              ))}
            </div>
          </div>

          {/* Main: Action Guide Content */}
          <div className="guide-main">
            {!selectedScheme ? (
              <div className="guide-placeholder">
                <span className="placeholder-icon">📍</span>
                <p>Select a scheme from the left to get a step-by-step application guide.</p>
              </div>
            ) : (
              <div className="guide-card fade-in">
                <div className="guide-card__header">
                  <h2>{selectedScheme.name}</h2>
                  <div className="guide-langs">
                    <button 
                      className={`lang-toggle ${currentLang === 'en' ? 'active' : ''}`}
                      onClick={() => handleGetGuide(selectedScheme, 'en')}
                      disabled={loading}
                    >
                      English
                    </button>
                    <button 
                      className={`lang-toggle ${currentLang === 'hi' ? 'active' : ''}`}
                      onClick={() => handleGetGuide(selectedScheme, 'hi')}
                      disabled={loading}
                    >
                      हिन्दी
                    </button>
                  </div>
                </div>

                <div className="guide-body">
                  {loading ? (
                    <div className="guide-loading">
                      <div className="spinner"></div>
                      <p>AI is creating your personalized action guide for {selectedScheme.name}...</p>
                    </div>
                  ) : (
                    <div className="guide-content fade-in">
                      {guideSteps ? (
                        <div className="markdown-content">
                          {guideSteps.split('\n').map((line, i) => {
                            if (line.trim().startsWith('#') || line.match(/^\d+\./)) {
                              return <h4 key={i} style={{ marginTop: '20px', color: '#2563eb' }}>{line}</h4>;
                            }
                            return <p key={i}>{line}</p>;
                          })}
                        </div>
                      ) : (
                        <p className="error">No guide steps generated yet.</p>
                      )}
                    </div>
                  )}
                </div>
                
                <div className="guide-footer">
                  <a href={selectedScheme.link} target="_blank" rel="noopener noreferrer" className="original-link">
                    Apply on Official Website ↗
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
