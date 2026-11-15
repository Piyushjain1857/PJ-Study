import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import recommendationService from '../../services/recommendationService.js';
import RecommendationReason from './RecommendationReason.jsx';
import Skeleton from '../common/Skeleton.jsx';

/**
 * Contextual Similar Notes widget embedded on Note Details page.
 * Excludes the target note and provides explainable connection reasons.
 *
 * @param {{
 *   noteId: string
 * }} props
 */
export function SimilarNotesSection({ noteId }) {
  const [similarNotes, setSimilarNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    if (!noteId) return;

    async function fetchSimilar() {
      setLoading(true);
      setError(null);
      try {
        const data = await recommendationService.getSimilarNotes(noteId, 4);
        if (isMounted) {
          setSimilarNotes(data?.similarNotes || []);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || 'Unable to load similar notes.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchSimilar();

    return () => {
      isMounted = false;
    };
  }, [noteId]);

  if (!loading && similarNotes.length === 0) {
    return null;
  }

  return (
    <div className="similar-notes-widget">
      <h3 className="similar-notes-title">Related Study Notes</h3>
      <p className="similar-notes-desc">
        Curriculum-aligned resources and manuscripts closely related to this topic.
      </p>

      {loading ? (
        <div className="similar-notes-grid">
          {[1, 2, 3, 4].map((n) => (
            <div
              key={n}
              style={{
                backgroundColor: 'var(--color-surface, #ffffff)',
                border: '1px solid var(--color-border, #e6e3dc)',
                borderRadius: '8px',
                padding: '16px'
              }}
            >
              <Skeleton width="50%" height={18} />
              <div style={{ marginTop: '8px' }}>
                <Skeleton width="100%" height={24} />
              </div>
              <div style={{ marginTop: '8px' }}>
                <Skeleton width="70%" height={16} />
              </div>
            </div>
          ))}
        </div>
      ) : error ? null : (
        <div className="similar-notes-grid">
          {similarNotes.map(({ note, reason, score }) => (
            <Link key={note.id} to={`/notes/${note.id}`} className="similar-note-card">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <RecommendationReason reason={reason} score={score} />
                <h4 className="similar-note-title">{note.title}</h4>
              </div>

              <div className="similar-note-meta">
                {note.subject?.name && <span>{note.subject.name}</span>}
                {note.semester && <span>• Sem {note.semester}</span>}
                <span>• {note.downloadCount || 0} downloads</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default SimilarNotesSection;
