import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { SCHEMES } from '../../data/schemes';
import './SchemeFinder.css';

const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY;

export default function SchemeFinder() {
  const { userProfile } = useAuth();
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    if (userProfile && userProfile.role === 'farmer') {
      getAIRecommendations();
    } else {
      setLoading(false);
    }
  }, [userProfile]);

  const getAIRecommendations = async () => {
    try {
      if (!OPENROUTER_API_KEY) {
        throw new Error('AI Service not configured (Missing API Key)');
      }

      const prompt = `
        You are an expert agriculture consultant in India. 
        Given the following farmer profile and a list of government schemes, recommend the top 3-5 most relevant schemes.
        
        Farmer Profile:
        - State: ${userProfile.state}
        - District: ${userProfile.district}
        - Farmer Type: ${userProfile.farmerType}
        - Land Size: ${userProfile.landSize} acres
        - Ownership: ${userProfile.landOwnership}
        - Irrigation: ${userProfile.irrigationType}
        - Crops: ${userProfile.crops?.join(', ') || 'Various'}
        - Farming Type: ${userProfile.organicFarming}
        
        Schemes Data:
        ${JSON.stringify(SCHEMES.map(s => ({ id: s.id, name: s.name, state: s.state, crops: s.cropsSupported, land: s.landSize, type: s.farmingType })), null, 2)}
        
        CRITICAL: Return ONLY a JSON array of objects. 
        Example format: [{"id": "pm-kisan", "matchScore": 95, "reason": "Matches your small land size and income support needs."}]
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
          "messages": [
            { "role": "user", "content": prompt }
          ]
        })
      });

      const data = await response.json();
      const content = data.choices[0].message.content;
      
      // Extract JSON if AI includes markdown code blocks
      const jsonStr = content.replace(/```json|```/g, '').trim();
      const aiRecs = JSON.parse(jsonStr);
      
      // Merge AI recs with original scheme data
      const merged = aiRecs.map(rec => {
        const fullScheme = SCHEMES.find(s => s.id === rec.id);
        return { ...fullScheme, ...rec };
      });

      setRecommendations(merged);
    } catch (err) {
      console.error("AI Error:", err);
      setError("AI Recommendations are currently unavailable. Showing all schemes.");
      // Fallback: Just show first few schemes
      setRecommendations(SCHEMES.slice(0, 3).map(s => ({ ...s, matchScore: 'N/A', reason: 'Recommended based on general profile.' })));
    } finally {
      setLoading(false);
    }
  };

  const filteredSchemes = SCHEMES.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.cropsSupported.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.benefit.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="scheme-finder">
      <div className="container">
        <header className="scheme-header">
          <h1>Scheme Finder</h1>
          <p>AI-powered government scheme discovery for Indian Farmers</p>
        </header>

        {/* AI Recommendations Section */}
        <section className="ai-recommendations">
          <h2 className="section-title">
            <span className="ai-badge">AI Powered</span>
            Personalized For You
          </h2>

          {loading ? (
            <div className="loading-ai">
              <div className="spinner"></div>
              <p>AI is analyzing your profile to find the best matches...</p>
            </div>
          ) : error ? (
            <div className="ai-error-box">
              <p>⚠️ {error}</p>
            </div>
          ) : (
            <div className="recommendations-grid">
              {recommendations.map(scheme => (
                <SchemeCard key={scheme.id} scheme={scheme} isAI />
              ))}
            </div>
          )}
        </section>

        {/* All Schemes Section */}
        <section className="all-schemes">
          <div className="dashboard__section-header">
            <h2>Explore All Schemes</h2>
            <p>Browse the full list of central and state government initiatives</p>
          </div>

          <div className="scheme-filters">
            <div className="search-box">
              <span className="search-icon">🔍</span>
              <input 
                type="text" 
                placeholder="Search schemes, crops, or benefits..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="recommendations-grid">
            {filteredSchemes.map(scheme => (
              <SchemeCard key={scheme.id} scheme={scheme} />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function SchemeCard({ scheme, isAI }) {
  return (
    <div className={`scheme-card ${isAI ? 'scheme-card--ai' : ''}`}>
      {isAI && scheme.matchScore && (
        <div className="scheme-card__match">{scheme.matchScore}% Match</div>
      )}
      
      <h3 className="scheme-card__title">{scheme.name}</h3>
      
      <div className="scheme-card__details">
        <div className="detail-item">
          <span>State</span>
          <span>{scheme.state}</span>
        </div>
        <div className="detail-item">
          <span>Land Size</span>
          <span>{scheme.landSize}</span>
        </div>
        <div className="detail-item">
          <span>Crops</span>
          <span>{scheme.cropsSupported}</span>
        </div>
        <div className="detail-item">
          <span>Farming</span>
          <span>{scheme.farmingType}</span>
        </div>
      </div>

      <div className="scheme-card__benefit">
        <span className="scheme-card__benefit-title">Primary Benefit</span>
        <p className="scheme-card__benefit-text">{scheme.benefit}</p>
      </div>

      {isAI && scheme.reason && (
        <p className="scheme-card__reason">
          <strong>Why this match?</strong> {scheme.reason}
        </p>
      )}

      <div className="scheme-card__footer">
        <a href={scheme.link} target="_blank" rel="noopener noreferrer" className="scheme-btn scheme-btn--primary">
          Official Website ↗
        </a>
        <button className="scheme-btn scheme-btn--outline" onClick={() => alert('Step-by-step application guide coming soon!')}>
          How to Apply
        </button>
      </div>
    </div>
  );
}
