'use client';

import { useEffect, useRef, useState } from 'react';
import { Camera, ImageOff, Maximize2, ShieldCheck, X } from 'lucide-react';
import { portalApi } from '../api';
import { niceDate } from '../i18n';

function InspectionPhotoTile({ photo, t, lang, onOpen }) {
  const [failed, setFailed] = useState(false);
  const label = photo.caption || photo.category || t.photoUntitled;
  return (
    <figure className="inspection-photo-tile">
      <button
        className="inspection-photo-open"
        type="button"
        onClick={() => onOpen(photo)}
        disabled={failed}
        aria-label={t.photoOpen + ': ' + label}
      >
        {failed ? (
          <span className="inspection-photo-unavailable">
            <ImageOff size={25} aria-hidden="true"/>
            <span>{t.photoUnavailable}</span>
          </span>
        ) : (
          <img
            src={photo.demoImage || portalApi.photoUrl(photo.id)}
            alt={label}
            loading="lazy"
            decoding="async"
            onError={() => setFailed(true)}
          />
        )}
        {!failed && <span className="inspection-photo-zoom" aria-hidden="true"><Maximize2 size={17}/></span>}
      </button>
      <figcaption>
        <strong title={label}>{label}</strong>
        <small>{photo.phase ? photo.phase + ' · ' : ''}{niceDate(photo.capturedAt, lang)}</small>
      </figcaption>
    </figure>
  );
}

export default function PublishedInspectionGallery({ photos = [], t, lang }) {
  const [activePhoto, setActivePhoto] = useState(null);
  const [previewFailed, setPreviewFailed] = useState(false);
  const closeButton = useRef(null);
  const previousFocus = useRef(null);

  useEffect(() => {
    if (!activePhoto) return undefined;
    previousFocus.current = document.activeElement;
    closeButton.current?.focus();
    const handleKeyDown = event => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setActivePhoto(null);
      }
      if (event.key === 'Tab') {
        // The only interactive item in the modal is its close button.
        event.preventDefault();
        closeButton.current?.focus();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      previousFocus.current?.focus?.();
    };
  }, [activePhoto]);

  const openPhoto = photo => {
    setPreviewFailed(false);
    setActivePhoto(photo);
  };

  return (
    <section id="inspection-photos" className="surface published-inspection-gallery" aria-label={t.photos}>
      <div className="published-inspection-heading">
        <div className="section-head">
          <span className="published-inspection-heading-icon"><Camera size={20} aria-hidden="true"/></span>
          <div>
            <h2>{t.photos}</h2>
            <p className="muted micro">{t.onlyPublished}</p>
          </div>
        </div>
        {photos.length > 0 && (
          <span className="published-inspection-count" aria-label={photos.length + ' ' + t.photos}>
            {photos.length} {t.photoCount}
          </span>
        )}
      </div>

      {photos.length > 0 ? (
        <div className="photo-grid published-inspection-grid">
          {photos.map(photo => (
            <InspectionPhotoTile key={photo.id} photo={photo} t={t} lang={lang} onOpen={openPhoto}/>
          ))}
        </div>
      ) : (
        <div className="published-inspection-empty" role="status">
          <div className="published-inspection-empty-icon"><Camera size={26} aria-hidden="true"/></div>
          <strong>{t.nonePhotos}</strong>
          <p>{t.photoEmptyHelp}</p>
          <span><ShieldCheck size={15} aria-hidden="true"/>{t.photoSharedByWorkshop}</span>
        </div>
      )}

      {activePhoto && (
        <div
          className="inspection-photo-lightbox"
          onMouseDown={event => {
            if (event.target === event.currentTarget) setActivePhoto(null);
          }}
        >
          <div className="inspection-photo-lightbox-panel" role="dialog" aria-modal="true"
            aria-label={t.photoPreview} aria-describedby="inspection-photo-preview-caption">
            <div className="inspection-photo-lightbox-head">
              <strong>{t.photoPreview}</strong>
              <button type="button" ref={closeButton} onClick={() => setActivePhoto(null)}
                className="inspection-photo-close" aria-label={t.photoClose}>
                <X size={20} aria-hidden="true"/>
              </button>
            </div>
            {previewFailed ? (
              <div className="inspection-photo-preview-failed">
                <ImageOff size={32} aria-hidden="true"/>{t.photoUnavailable}
              </div>
            ) : (
              <img
                src={activePhoto.demoImage || portalApi.photoUrl(activePhoto.id)}
                alt={activePhoto.caption || activePhoto.category || t.photoUntitled}
                onError={() => setPreviewFailed(true)}
              />
            )}
            <div className="inspection-photo-lightbox-caption" id="inspection-photo-preview-caption">
              <strong>{activePhoto.caption || activePhoto.category || t.photoUntitled}</strong>
              <span>{niceDate(activePhoto.capturedAt, lang)}</span>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
