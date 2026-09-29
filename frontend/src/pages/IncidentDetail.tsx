import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { TopBar } from '../components/Layout/TopBar';
import { SeverityBadge, StatusBadge, RiskScore } from '../components/common/Badges';
import { LoadingOverlay, ErrorState } from '../components/common/States';
import { incidentsApi } from '../api/incidents';
import { aiApi } from '../api/ai';
import type { Incident, IncidentStatus, AiAnalysis } from '../types';
import { ArrowLeft, Brain, AlertTriangle, CheckCircle, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';

const STATUS_OPTIONS: IncidentStatus[] = ['open', 'investigating', 'resolved', 'false_positive'];

export const IncidentDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [incident, setIncident] = useState<Incident | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [analysis, setAnalysis] = useState<AiAnalysis | null>(null);
  const [showEvidence, setShowEvidence] = useState(false);

  const fetchIncident = async () => {
    setLoading(true);
    try {
      const data = await incidentsApi.get(Number(id));
      setIncident(data);
      if (data.ai_analysis) setAnalysis(data.ai_analysis);
    } catch {
      setError('Incident not found');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (status: IncidentStatus) => {
    if (!incident) return;
    try {
      const updated = await incidentsApi.update(incident.id, { status });
      setIncident(updated);
      toast.success(`Status updated to ${status}`);
    } catch {
      toast.error('Failed to update status');
    }
  };

  const handleAiAnalysis = async () => {
    if (!incident) return;
    setAiLoading(true);
    try {
      const result = await aiApi.analyze(incident.id);
      setAnalysis(result.analysis);
      toast.success(result.cached ? 'Loaded cached analysis' : 'AI analysis complete');
    } catch {
      toast.error('AI analysis failed');
    } finally {
      setAiLoading(false);
    }
  };

  useEffect(() => { fetchIncident(); }, [id]);

  const confidenceColor = (c?: string) =>
    c === 'high' ? 'text-sentinel-green' : c === 'medium' ? 'text-sentinel-amber' : 'text-sentinel-muted';

  return (
    <div className="flex flex-col h-full">
      <TopBar title="Incident Detail" />
      <div className="flex-1 overflow-y-auto p-6">
        <button onClick={() => navigate('/incidents')} className="flex items-center gap-2 text-sentinel-muted hover:text-sentinel-text text-sm mb-5 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to incidents
        </button>

        {loading ? <LoadingOverlay /> : error ? <ErrorState message={error} /> : incident && (
          <div className="space-y-5 animate-fade-in">
            {/* Header */}
            <div className="card">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    <span className="text-sentinel-muted text-sm font-mono">#{incident.id}</span>
                    <SeverityBadge severity={incident.severity} />
                    <StatusBadge status={incident.status} />
                  </div>
                  <h2 className="text-xl font-bold text-sentinel-text mb-1">{incident.title}</h2>
                  {incident.description && <p className="text-sentinel-muted text-sm">{incident.description}</p>}
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-3xl font-bold text-sentinel-text">
                    <RiskScore score={incident.risk_score} />
                  </div>
                  <div className="text-xs text-sentinel-muted">Risk Score</div>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-4 border-t border-sentinel-border">
                <div>
                  <div className="text-xs text-sentinel-muted mb-1">Source IP</div>
                  <div className="font-mono text-sm text-sentinel-accent">{incident.source_ip || '—'}</div>
                </div>
                <div>
                  <div className="text-xs text-sentinel-muted mb-1">Target Asset</div>
                  <div className="text-sm text-sentinel-text">{incident.target_asset || '—'}</div>
                </div>
                <div>
                  <div className="text-xs text-sentinel-muted mb-1">Detection Rule</div>
                  <div className="text-sm text-sentinel-text">{incident.detection_rule?.replace(/_/g, ' ') || '—'}</div>
                </div>
                <div>
                  <div className="text-xs text-sentinel-muted mb-1">Created</div>
                  <div className="text-sm text-sentinel-text">
                    {format(new Date(incident.created_at), 'MMM d, yyyy HH:mm')}
                  </div>
                </div>
              </div>
            </div>

            {/* Status & Actions */}
            <div className="card">
              <h3 className="text-sm font-semibold text-sentinel-text mb-3">Update Status</h3>
              <div className="flex gap-2 flex-wrap">
                {STATUS_OPTIONS.map(s => (
                  <button
                    key={s}
                    onClick={() => handleStatusChange(s)}
                    className={`btn text-xs ${incident.status === s ? 'btn-primary' : 'btn-ghost'}`}
                  >
                    {s.replace('_', ' ').toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* Evidence */}
            {incident.evidence && Object.keys(incident.evidence).length > 0 && (
              <div className="card">
                <button
                  onClick={() => setShowEvidence(!showEvidence)}
                  className="flex items-center justify-between w-full text-sm font-semibold text-sentinel-text"
                >
                  <span>Evidence</span>
                  {showEvidence ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                {showEvidence && (
                  <pre className="mt-3 text-xs font-mono text-sentinel-muted bg-sentinel-bg rounded-lg p-3 overflow-auto">
                    {JSON.stringify(incident.evidence, null, 2)}
                  </pre>
                )}
              </div>
            )}

            {/* AI Analyst */}
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Brain className="w-5 h-5 text-sentinel-accent" />
                  <h3 className="text-sm font-semibold text-sentinel-text">AI Security Analysis</h3>
                </div>
                <button
                  onClick={handleAiAnalysis}
                  disabled={aiLoading}
                  className="btn-primary text-xs"
                >
                  {aiLoading ? (
                    <><RefreshCw className="w-3 h-3 animate-spin" /> Analyzing...</>
                  ) : analysis ? (
                    <><RefreshCw className="w-3 h-3" /> Re-analyze</>
                  ) : (
                    <><Brain className="w-3 h-3" /> Run Analysis</>
                  )}
                </button>
              </div>

              {!analysis ? (
                <div className="text-center py-6 text-sentinel-muted text-sm">
                  Click "Run Analysis" to generate an AI-powered incident report
                </div>
              ) : (
                <div className="space-y-4 animate-fade-in">
                  <div className="flex items-center gap-3 p-3 bg-sentinel-bg rounded-lg border border-sentinel-border">
                    <div className="flex-1">
                      <div className="text-xs text-sentinel-muted mb-1">Likely Attack</div>
                      <div className="text-sm font-semibold text-sentinel-text">{analysis.likely_attack}</div>
                    </div>
                    <div>
                      <div className="text-xs text-sentinel-muted mb-1">Confidence</div>
                      <div className={`text-sm font-bold uppercase ${confidenceColor(analysis.confidence)}`}>
                        {analysis.confidence}
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="text-xs text-sentinel-muted mb-2 font-medium">Summary</div>
                    <p className="text-sm text-sentinel-text/90 leading-relaxed">{analysis.summary}</p>
                  </div>

                  {analysis.suspicious_indicators?.length > 0 && (
                    <div>
                      <div className="text-xs text-sentinel-muted mb-2 font-medium flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> Suspicious Indicators
                      </div>
                      <ul className="space-y-1">
                        {analysis.suspicious_indicators.map((ind, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-sentinel-text/80">
                            <span className="text-sentinel-red mt-1">•</span> {ind}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {analysis.investigation_steps?.length > 0 && (
                      <div>
                        <div className="text-xs text-sentinel-muted mb-2 font-medium">Investigation Steps</div>
                        <ol className="space-y-1">
                          {analysis.investigation_steps.map((step, i) => (
                            <li key={i} className="text-sm text-sentinel-text/80">
                              <span className="text-sentinel-accent font-mono mr-2">{i + 1}.</span>{step}
                            </li>
                          ))}
                        </ol>
                      </div>
                    )}
                    {analysis.remediation?.length > 0 && (
                      <div>
                        <div className="text-xs text-sentinel-muted mb-2 font-medium flex items-center gap-1">
                          <CheckCircle className="w-3 h-3 text-sentinel-green" /> Remediation
                        </div>
                        <ol className="space-y-1">
                          {analysis.remediation.map((r, i) => (
                            <li key={i} className="text-sm text-sentinel-text/80">
                              <span className="text-sentinel-green font-mono mr-2">{i + 1}.</span>{r}
                            </li>
                          ))}
                        </ol>
                      </div>
                    )}
                  </div>

                  {analysis.potential_impact && (
                    <div className="p-3 bg-sentinel-red/10 border border-sentinel-red/20 rounded-lg">
                      <div className="text-xs text-sentinel-red mb-1 font-medium">Potential Impact</div>
                      <p className="text-sm text-sentinel-text/80">{analysis.potential_impact}</p>
                    </div>
                  )}

                  {analysis.mitre_techniques?.length > 0 && (
                    <div>
                      <div className="text-xs text-sentinel-muted mb-2 font-medium">MITRE ATT&CK</div>
                      <div className="flex gap-2 flex-wrap">
                        {analysis.mitre_techniques.map(t => (
                          <a
                            key={t}
                            href={`https://attack.mitre.org/techniques/${t.replace('.', '/')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="badge bg-sentinel-purple/20 text-sentinel-purple border border-sentinel-purple/30 hover:bg-sentinel-purple/30"
                          >
                            {t}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {analysis.analyst_note && (
                    <p className="text-xs text-sentinel-muted italic">{analysis.analyst_note}</p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
