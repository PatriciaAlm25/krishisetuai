import React, { useState } from 'react';
import { SCHEMES } from '../../data/schemes';
import './AISimplify.css';

const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY;

export default function AISimplify() {
  const [selectedScheme, setSelectedScheme] = useState(null);
  const [simplifiedText, setSimplifiedText] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentLang, setCurrentLang] = useState('en');

  const handleSimplify = async (scheme, lang) => {
    setLoading(true);
    setSelectedScheme(scheme);
    setCurrentLang(lang);
    setSimplifiedText('');

    try {
      const prompt = `
        Simplify the following government scheme details for an Indian farmer who prefers ${lang === 'hi' ? 'Hindi' : 'English'}.
        Use very simple, easy-to-understand language. Focus on:
        1. What is it?
        2. What will I get?
        3. Who can apply?
        
        Scheme Name: ${scheme.name}
        Benefit: ${scheme.benefit}
        State: ${scheme.state}
        Land Requirement: ${scheme.landSize}
        Crops Supported: ${scheme.cropsSupported}
        
        ${lang === 'hi' ? 'Provide the response in Hindi only.' : 'Provide the response in English only.'}
        Keep it under 150 words.
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
      setSimplifiedText(data.choices[0].message.content);
    } catch (err) {
      console.error("Simplification Error:", err);
      setSimplifiedText("Sorry, I couldn't simplify this right now. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ai-simplify-page">
      <div className="container">
        <header className="simplify-header">
          <h1>🤖 AI Scheme Simplifier</h1>
          <p>Get complex government schemes explained in simple English or Hindi</p>
        </header>

        <div className="simplify-layout">
          {/* Sidebar: Scheme List */}
          <div className="scheme-sidebar">
            <h3>Select a Scheme</h3>
            <div className="scheme-list">
              {SCHEMES.map(s => (
                <button 
                  key={s.id} 
                  className={`scheme-select-btn ${selectedScheme?.id === s.id ? 'active' : ''}`}
                  onClick={() => handleSimplify(s, 'en')}
                >
                  {s.name}
                </button>
              ))}
            </div>
          </div>

          {/* Main: Simplified Content */}
          <div className="simplify-main">
            {!selectedScheme ? (
              <div className="simplify-placeholder">
                <span className="placeholder-icon">📋</span>
                <p>Select a scheme from the left to get an AI-simplified version.</p>
              </div>
            ) : (
              <div className="simplify-card fade-in">
                <div className="simplify-card__header">
                  <h2>{selectedScheme.name}</h2>
                  <div className="simplify-langs">
                    <button 
                      className={`lang-toggle ${currentLang === 'en' ? 'active' : ''}`}
                      onClick={() => handleSimplify(selectedScheme, 'en')}
                      disabled={loading}
                    >
                      English
                    </button>
                    <button 
                      className={`lang-toggle ${currentLang === 'hi' ? 'active' : ''}`}
                      onClick={() => handleSimplify(selectedScheme, 'hi')}
                      disabled={loading}
                    >
                      हिन्दी
                    </button>
                  </div>
                </div>

                <div className="simplify-body">
                  {loading ? (
                    <div className="simplify-loading">
                      <div className="spinner"></div>
                      <p>AI is translating and simplifying {selectedScheme.name}...</p>
                    </div>
                  ) : (
                    <div className="simplify-content fade-in">
                      {simplifiedText ? (
                        <div className="markdown-content">
                          {simplifiedText.split('\n').map((line, i) => (
                            <p key={i}>{line}</p>
                          ))}
                        </div>
                      ) : (
                        <p className="error">No simplification generated yet.</p>
                      )}
                    </div>
                  )}
                </div>
                
                <div className="simplify-footer">
                  <a href={selectedScheme.link} target="_blank" rel="noopener noreferrer" className="original-link">
                    View Original Scheme Website ↗
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
