import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TopBar } from '../components/Layout/TopBar';
import { SeverityBadge, RiskScore } from '../components/common/Badges';

import { incidentsApi } from '../api/incidents';
import { aiApi } from '../api/ai';
import type { Incident, AiAnalysis } from '../types';
import { Brain, AlertTriangle, ChevronRight, Zap, RefreshCw } from 'lucide-react';

export const AIAnalyst: React.FC = () => {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [selected, setSelected] = useState<Incident | null>(null);
  const [analysis, setAnalysis] = useState<AiAnalysis | null>(null);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetch = async () => {
      setLoadingList(true);
      const res = await incidentsApi.list({ size: 20, status: 'open' });
      setIncidents(res.items);
      setLoadingList(false);
    };
    fetch();
  }, []);

  const selectIncident = async (incident: Incident) => {
    setSelected(incident);
    setAnalysis(null);
    if (incident.ai_analysis) {
      setAnalysis(incident.ai_analysis);
      return;
    }
    setLoadingAnalysis(true);
    try {
      const result = await aiApi.analyze(incident.id);
      setAnalysis(result.analysis);
    } catch {
      setAnalysis(null);
    } finally {
      setLoadingAnalysis(false);
    }
  };

  const reanalyze = async () => {
    if (!selected) return;
    await aiApi.clearCache(selected.id);
    setLoadingAnalysis(true);
    try {
      const result = await aiApi.analyze(selected.id);
      setAnalysis(result.analysis);
    } finally {
      setLoadingAnalysis(false);
    }
  };

  const confidenceColor = (c?: string) =>
    c === 'high' ? 'text-sentinel-green' : c === 'medium' ? 'text-sentinel-amber' : 'text-sentinel-red';

  return (
    <div className="flex flex-col h-full">
      <TopBar title="AI Security Analyst" subtitle="Powered by large language models" />
      <div className="flex-1 overflow-hidden flex">
        {/* Left panel: incident list */}
        <div className="w-72 flex-shrink-0 border-r border-sentinel-border flex flex-col overflow-hidden">
          <div className="p-4 border-b border-sentinel-border">
            <h3 className="text-xs text-sentinel-muted font-medium uppercase tracking-wider">Open Incidents</h3>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {loadingList ? (
              <div className="flex justify-center pt-10"><div className="animate-spin w-5 h-5 border-2 border-sentinel-accent border-t-transparent rounded-full" /></div>
            ) : incidents.length === 0 ? (
              <div className="text-center pt-10 text-sentinel-muted text-sm">No open incidents</div>
            ) : (
              incidents.map(i => (
                <button
                  key={i.id}
                  onClick={() => selectIncident(i)}
                  className={`w-full text-left p-3 rounded-lg transition-all duration-150 ${selected?.id === i.id ? 'bg-sentinel-accent/10 border border-sentinel-accent/30' : 'hover:bg-sentinel-surface/50 border border-transparent'}`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <SeverityBadge severity={i.severity} />
                    <RiskScore score={i.risk_score} className="text-xs ml-auto" />
                  </div>
                  <p className="text-xs font-medium text-sentinel-text truncate">{i.title}</p>
                  <p className="text-xs text-sentinel-muted mt-0.5 font-mono">{i.source_ip}</p>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Right panel: analysis */}
        <div className="flex-1 overflow-y-auto p-6">
          {!selected ? (
            <div className="flex flex-col items-center justify-center h-full text-center gap-4">
              <div className="w-20 h-20 rounded-full bg-sentinel-accent/10 border border-sentinel-accent/20 flex items-center justify-center">
                <Brain className="w-10 h-10 text-sentinel-accent/60" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-sentinel-text mb-2">SentinelX AI Analyst</h3>
                <p className="text-sentinel-muted text-sm max-w-sm">
                  Select an incident from the left panel to generate an AI-powered security analysis with investigation steps and remediation guidance.
                </p>
              </div>
              <div className="flex flex-wrap gap-2 justify-center text-xs text-sentinel-muted">
                {['Attack Classification', 'MITRE ATT&CK Mapping', 'Investigation Steps', 'Remediation Guidance'].map(f => (
                  <span key={f} className="badge bg-sentinel-surface border border-sentinel-border">{f}</span>
                ))}
              </div>
            </div>
          ) : loadingAnalysis ? (
            <div className="flex flex-col items-center justify-center h-full gap-3">
              <div className="animate-spin w-10 h-10 border-2 border-sentinel-accent border-t-transparent rounded-full" />
              <p className="text-sentinel-muted text-sm">Analyzing incident with AI...</p>
            </div>
          ) : analysis ? (
            <div className="space-y-5 animate-fade-in">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-lg font-bold text-sentinel-text">{selected.title}</h2>
                  <div className="flex items-center gap-3 mt-1">
                    <SeverityBadge severity={selected.severity} />
                    <span className="font-mono text-xs text-sentinel-muted">{selected.source_ip}</span>
                  </div>
                </div>
                <button onClick={reanalyze} className="btn-ghost text-xs">
                  <RefreshCw className="w-3 h-3" /> Re-analyze
                </button>
              </div>

              {/* Attack summary */}
              <div className="card border-sentinel-accent/30 bg-sentinel-accent/5">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-xs text-sentinel-muted mb-1">Identified Attack</div>
                    <div className="text-xl font-bold text-sentinel-text">{analysis.likely_attack}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-sentinel-muted mb-1">AI Confidence</div>
                    <div className={`text-lg font-bold uppercase ${confidenceColor(analysis.confidence)}`}>{analysis.confidence}</div>
                  </div>
                </div>
                <p className="text-sm text-sentinel-text/80 mt-3 leading-relaxed">{analysis.summary}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Indicators */}
                <div className="card">
                  <div className="flex items-center gap-2 mb-3">
                    <AlertTriangle className="w-4 h-4 text-sentinel-amber" />
                    <h3 className="text-sm font-semibold">Suspicious Indicators</h3>
                  </div>
                  <ul className="space-y-2">
                    {analysis.suspicious_indicators?.map((ind, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-sentinel-text/80">
                        <span className="text-sentinel-amber mt-1 flex-shrink-0">▸</span>{ind}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Impact */}
                <div className="card border-sentinel-red/20 bg-sentinel-red/5">
                  <div className="flex items-center gap-2 mb-3">
                    <Zap className="w-4 h-4 text-sentinel-red" />
                    <h3 className="text-sm font-semibold text-sentinel-red">Potential Impact</h3>
                  </div>
                  <p className="text-sm text-sentinel-text/80">{analysis.potential_impact}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Investigation */}
                <div className="card">
                  <h3 className="text-sm font-semibold mb-3 text-sentinel-accent">Investigation Steps</h3>
                  <ol className="space-y-2">
                    {analysis.investigation_steps?.map((step, i) => (
                      <li key={i} className="flex items-start gap-3 text-sm text-sentinel-text/80">
                        <span className="text-sentinel-accent font-mono text-xs bg-sentinel-accent/10 w-5 h-5 rounded flex items-center justify-center flex-shrink-0">{i+1}</span>
                        {step}
                      </li>
                    ))}
                  </ol>
                </div>

                {/* Remediation */}
                <div className="card">
                  <h3 className="text-sm font-semibold mb-3 text-sentinel-green">Remediation Actions</h3>
                  <ol className="space-y-2">
                    {analysis.remediation?.map((action, i) => (
                      <li key={i} className="flex items-start gap-3 text-sm text-sentinel-text/80">
                        <span className="text-sentinel-green font-mono text-xs bg-sentinel-green/10 w-5 h-5 rounded flex items-center justify-center flex-shrink-0">{i+1}</span>
                        {action}
                      </li>
                    ))}
                  </ol>
                </div>
              </div>

              {/* MITRE */}
              {analysis.mitre_techniques?.length > 0 && (
                <div className="card">
                  <h3 className="text-sm font-semibold mb-3">MITRE ATT&CK Techniques</h3>
                  <div className="flex gap-2 flex-wrap">
                    {analysis.mitre_techniques.map(t => (
                      <a
                        key={t}
                        href={`https://attack.mitre.org/techniques/${t.replace('.', '/')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="badge bg-sentinel-purple/20 text-sentinel-purple border border-sentinel-purple/30 hover:bg-sentinel-purple/30 transition-colors"
                      >
                        {t}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {analysis.analyst_note && (
                <p className="text-xs text-sentinel-muted italic p-3 bg-sentinel-surface rounded-lg">{analysis.analyst_note}</p>
              )}

              <button
                onClick={() => navigate(`/incidents/${selected.id}`)}
                className="btn-primary w-full justify-center"
              >
                <ChevronRight className="w-4 h-4" /> Go to Full Incident
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-sentinel-muted">
              <p>Analysis failed. Try again.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
