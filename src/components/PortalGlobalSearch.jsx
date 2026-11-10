'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { CarFront, FileText, Search, Wrench, X } from 'lucide-react';
import { buildPortalSearchRecords, searchPortalRecords } from '../portalGlobalSearch';

const ICONS = { vehicle: CarFront, job: Wrench, invoice: FileText, estimate: FileText };

export default function PortalGlobalSearch({ session, t, onVehicleOpen }) {
  const [query, setQuery] = useState('');
  const [expanded, setExpanded] = useState(false);
  const wrapper = useRef(null);
  const input = useRef(null);
  const entries = useMemo(() => buildPortalSearchRecords(session), [session]);
  const results = useMemo(() => searchPortalRecords(entries, query), [entries, query]);
  const showResults = expanded && query.trim().length > 0;

  const selectResult = result => {
    setQuery('');
    setExpanded(false);
    onVehicleOpen(result.vehicleId, result.section);
  };

  useEffect(() => {
    const outside = event => {
      if (!wrapper.current?.contains(event.target)) setExpanded(false);
    };
    const shortcut = event => {
      const isSearchShortcut = (event.ctrlKey || event.metaKey)
        && event.key.toLowerCase() === 'k';
      if (isSearchShortcut) {
        event.preventDefault();
        input.current?.focus();
        setExpanded(true);
      }
      if (event.key === 'Escape' && wrapper.current?.contains(document.activeElement)) {
        setExpanded(false);
        input.current?.blur();
      }
    };
    document.addEventListener('pointerdown', outside);
    document.addEventListener('keydown', shortcut);
    return () => {
      document.removeEventListener('pointerdown', outside);
      document.removeEventListener('keydown', shortcut);
    };
  }, []);

  return (
    <div className="portal-global-search" role="search" ref={wrapper}>
      <label className="sr-only" htmlFor="portal-global-search-input">{t.globalSearch}</label>
      <div className="portal-global-search-input-row">
        <Search size={18} aria-hidden="true"/>
        <input id="portal-global-search-input" ref={input} type="search" autoComplete="off"
          value={query} maxLength={100} placeholder={t.globalSearchPlaceholder}
          aria-controls="portal-global-search-results" aria-expanded={showResults}
          onChange={event => { setQuery(event.target.value); setExpanded(true); }}
          onFocus={() => setExpanded(true)}
          onKeyDown={event => {
            if (event.key === 'Enter' && results.length) {
              event.preventDefault();
              selectResult(results[0]);
            }
          }}
        />
        {query && <button type="button" className="portal-global-search-clear"
          onClick={() => { setQuery(''); input.current?.focus(); }}
          aria-label={t.clearSearch}><X size={17} aria-hidden="true"/></button>}
      </div>

      {showResults && (
        <div className="portal-global-search-dropdown" id="portal-global-search-results"
          role="region" aria-label={t.searchResults}>
          <div className="portal-global-search-caption">
            <span>{t.searchResults}</span>
            <small>{results.length} {t.searchMatches}</small>
          </div>
          {results.length ? (
            <div className="portal-global-search-items">
              {results.map(result => {
                const Icon = ICONS[result.kind] || Search;
                const kindLabels = {
                  vehicle: t.searchTypeVehicle, job: t.searchTypeJob,
                  invoice: t.searchTypeInvoice, estimate: t.searchTypeEstimate,
                };
                return (
                  <button type="button" key={result.key}
                    className="portal-global-search-result"
                    onClick={() => selectResult(result)}>
                    <span className="portal-global-search-result-icon">
                      <Icon size={18} aria-hidden="true"/>
                    </span>
                    <span className="portal-global-search-result-body">
                      <strong>{result.title || kindLabels[result.kind]}</strong>
                      <small>{result.description || kindLabels[result.kind]}</small>
                    </span>
                    <span className="portal-global-search-result-kind">{kindLabels[result.kind]}</span>
                  </button>
                );
              })}
            </div>
          ) : (
            <p className="portal-global-search-empty">{t.noSearchResults}</p>
          )}
        </div>
      )}
    </div>
  );
}
