import React, { useState, useCallback, useRef } from 'react';
import { Upload, AlertCircle, Zap, Shield } from 'lucide-react';

// --- Types ---
export interface UploadResponse {
  risk_score: number;
  status: 'Cyan' | 'Amber' | 'Red';
  procurement_flags: string[];
  compliance_flags: string[];
  agent_reasoning: string;
}

interface UploadDashboardProps {
  onUploadComplete?: (report: UploadResponse) => void;
}

export const UploadDashboard: React.FC<UploadDashboardProps> = ({ onUploadComplete }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [report, setReport] = useState<UploadResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const processFiles = async (files: FileList | File[]) => {
    setIsUploading(true);
    setError(null);
    setReport(null);

    let combinedReport: UploadResponse = {
      risk_score: 0,
      status: 'Cyan',
      procurement_flags: [],
      compliance_flags: [],
      agent_reasoning: ''
    };
    let count = 0;

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const formData = new FormData();
        formData.append('file', file);

        const isStructured = file.name.match(/\.(csv|json|parquet)$/i);
        const isUnstructured = file.name.match(/\.(pdf|png|jpg|jpeg)$/i);

        let endpoint = '';
        if (isStructured) {
          endpoint = 'http://localhost:8000/api/upload/structured';
        } else if (isUnstructured) {
          endpoint = 'http://localhost:8000/api/upload/unstructured';
        } else {
          continue;
        }

        const response = await fetch(endpoint, { method: 'POST', body: formData });
        if (!response.ok) {
          let errorMsg = 'Failed to process file.';
          try { const d = await response.json(); errorMsg = d.detail || errorMsg; } catch { /* ignore */ }
          throw new Error(errorMsg);
        }
        
        const data: UploadResponse = await response.json();
        combinedReport.risk_score = Math.max(combinedReport.risk_score, data.risk_score);
        combinedReport.procurement_flags.push(...data.procurement_flags);
        combinedReport.compliance_flags.push(...data.compliance_flags);
        if (data.agent_reasoning) {
            combinedReport.agent_reasoning += `[${file.name}]\n${data.agent_reasoning}\n\n`;
        }
        count++;
      }

      if (count === 0) {
        throw new Error('Unsupported file type(s). Please upload .csv, .json, .parquet, .pdf, .png, or .jpg.');
      }

      if (combinedReport.risk_score > 70) combinedReport.status = 'Red';
      else if (combinedReport.risk_score > 40) combinedReport.status = 'Amber';

      setReport(combinedReport);
      if (onUploadComplete) onUploadComplete(combinedReport);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred during upload.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files?.length) processFiles(e.dataTransfer.files);
  }, [onUploadComplete]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) processFiles(e.target.files);
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'Cyan':  return { color: 'var(--accent-bright)', border: 'rgba(20,160,210,0.3)', bg: 'rgba(20,160,210,0.08)' };
      case 'Amber': return { color: 'var(--risk-medium)',   border: 'rgba(245,158,11,0.3)', bg: 'rgba(245,158,11,0.08)' };
      case 'Red':   return { color: 'var(--risk-high)',     border: 'rgba(240,68,68,0.3)',  bg: 'rgba(240,68,68,0.08)'  };
      default:      return { color: 'var(--text-muted)',    border: 'var(--border)',         bg: 'var(--surface)'        };
    }
  };

  return (
    <div style={{ padding: '0', color: 'var(--text)' }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>

        {/* Header */}
        <header style={{ marginBottom: 32 }}>
          <p className="label-eyebrow" style={{ marginBottom: 8 }}>Ingestion Pipeline</p>
          <h1 style={{ marginBottom: 6 }}>Unified File Upload Gateway</h1>
          <p className="text-muted">Upload structured ledger data or unstructured contracts for automated risk analysis.</p>
        </header>

        {/* Upload Drop Zone */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          style={{
            position: 'relative',
            border: `2px dashed ${isDragging ? 'var(--accent)' : 'var(--border)'}`,
            borderRadius: 16,
            padding: '56px 32px',
            textAlign: 'center',
            cursor: 'pointer',
            background: isDragging
              ? 'radial-gradient(ellipse at center, rgba(20,160,210,0.08) 0%, transparent 70%)'
              : 'var(--gradient-card)',
            transition: 'border-color 0.25s ease, background 0.25s ease',
            marginBottom: 24,
            boxShadow: isDragging ? 'inset 0 0 40px rgba(20,160,210,0.06)' : 'none',
          }}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            style={{ display: 'none' }}
            accept=".csv,.json,.parquet,.pdf,.png,.jpg,.jpeg"
            multiple
          />

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, pointerEvents: 'none' }}>
            <div style={{
              width: 56, height: 56,
              borderRadius: '50%',
              background: isDragging ? 'rgba(20,160,210,0.15)' : 'rgba(20,160,210,0.07)',
              border: `1px solid ${isDragging ? 'rgba(20,160,210,0.5)' : 'var(--border)'}`,
              display: 'grid', placeItems: 'center',
              boxShadow: isDragging ? '0 0 24px rgba(20,160,210,0.3)' : 'none',
              transition: 'all 0.25s ease',
            }}>
              <Upload size={24} color={isDragging ? 'var(--accent-bright)' : 'var(--accent)'} />
            </div>
            <div>
              <p style={{ fontSize: 16, fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>
                {isUploading ? 'Processing Document...' : isDragging ? 'Drop it now' : 'Drag & Drop files here'}
              </p>
              <p className="text-muted">Supported: CSV, JSON, PARQUET, PDF, PNG, JPG</p>
            </div>
          </div>

          {/* Uploading Spinner Overlay */}
          {isUploading && (
            <div style={{
              position: 'absolute', inset: 0,
              background: 'rgba(0,0,0,0.75)',
              borderRadius: 14,
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              gap: 16, zIndex: 10,
              backdropFilter: 'blur(4px)',
            }}>
              <div style={{
                width: 44, height: 44,
                border: '3px solid rgba(20,160,210,0.15)',
                borderTop: '3px solid var(--accent-bright)',
                borderRadius: '50%',
                animation: 'spin 0.8s linear infinite',
              }} />
              <p style={{ color: 'var(--accent-bright)', fontSize: 13, fontWeight: 600, letterSpacing: '0.06em' }}>
                RUNNING AI ANALYSIS PIPELINE...
              </p>
            </div>
          )}
        </div>

        {/* Error State */}
        {error && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '14px 18px',
            borderRadius: 10,
            background: 'rgba(240,68,68,0.07)',
            border: '1px solid rgba(240,68,68,0.25)',
            color: 'var(--risk-high)',
            marginBottom: 24,
          }}>
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <p style={{ fontSize: 13 }}>{error}</p>
          </div>
        )}

        {/* Analytics Report */}
        {report && (() => {
          const s = getStatusStyle(report.status);
          return (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                <div style={{ height: 28, width: 2, background: 'var(--accent)', borderRadius: 2, boxShadow: '0 0 8px var(--accent)' }} />
                <h2 style={{ margin: 0 }}>Unified Analytics Report</h2>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 20, marginBottom: 20 }}>

                {/* Score Card */}
                <div className="card" style={{
                  background: s.bg,
                  border: `1px solid ${s.border}`,
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center',
                  textAlign: 'center', padding: 32, gap: 12,
                }}>
                  <p className="label-eyebrow" style={{ color: s.color }}>ProcureGuard Index</p>
                  <p style={{ fontSize: 72, fontWeight: 900, lineHeight: 1, color: s.color, letterSpacing: '-4px' }}>
                    {report.risk_score}
                  </p>
                  <div style={{
                    padding: '4px 14px', borderRadius: 999,
                    background: 'rgba(0,0,0,0.3)',
                    border: `1px solid ${s.border}`,
                  }}>
                    <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: s.color }}>
                      {report.status} Status
                    </span>
                  </div>
                </div>

                {/* Flags Panel */}
                <div className="card" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                  <div>
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, color: 'var(--risk-medium)', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                      <Zap size={13} /> Procurement Flags
                    </h3>
                    {report.procurement_flags.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {report.procurement_flags.map((flag, idx) => (
                          <div key={idx} style={{
                            padding: '10px 12px', borderRadius: 8,
                            background: 'rgba(245,158,11,0.07)',
                            border: '1px solid rgba(245,158,11,0.2)',
                            fontSize: 12, color: 'var(--text)',
                            display: 'flex', gap: 8,
                          }}>
                            <span style={{ color: 'var(--risk-medium)', flexShrink: 0 }}>!</span>
                            {flag}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted" style={{ fontStyle: 'italic' }}>No procurement anomalies detected.</p>
                    )}
                  </div>

                  <div>
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, color: 'var(--risk-high)', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                      <Shield size={13} /> Compliance Flags
                    </h3>
                    {report.compliance_flags.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {report.compliance_flags.map((flag, idx) => (
                          <div key={idx} style={{
                            padding: '10px 12px', borderRadius: 8,
                            background: 'rgba(240,68,68,0.07)',
                            border: '1px solid rgba(240,68,68,0.2)',
                            fontSize: 12, color: 'var(--text)',
                            display: 'flex', gap: 8,
                          }}>
                            <span style={{ color: 'var(--risk-high)', flexShrink: 0 }}>×</span>
                            {flag}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted" style={{ fontStyle: 'italic' }}>No compliance violations detected.</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Reasoning Console */}
              <div className="card" style={{ background: '#020609' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                  <h3 style={{
                    margin: 0, fontSize: 11,
                    textTransform: 'uppercase', letterSpacing: '0.18em',
                    color: 'var(--text-muted)',
                    display: 'flex', alignItems: 'center', gap: 8,
                  }}>
                    <span style={{
                      width: 6, height: 6, borderRadius: '50%',
                      background: 'var(--accent-bright)',
                      display: 'inline-block',
                      boxShadow: '0 0 8px var(--accent-bright)',
                      animation: 'pulse 2s ease-in-out infinite',
                    }} />
                    Neural Reasoning Console
                  </h3>
                  <span className="text-dim" style={{ fontFamily: 'monospace', fontSize: 10, letterSpacing: '0.12em' }}>
                    v4.0.2 // SECURE_NODE
                  </span>
                </div>
                <div style={{
                  background: 'rgba(0,0,0,0.6)',
                  padding: '16px 20px',
                  borderRadius: 10,
                  border: '1px solid rgba(20,160,210,0.12)',
                }}>
                  <pre style={{
                    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                    fontSize: 12,
                    color: 'var(--accent-bright)',
                    whiteSpace: 'pre-wrap',
                    lineHeight: 1.7,
                    opacity: 0.9,
                  }}>
                    {report.agent_reasoning || '> Agent reasoning empty.'}
                  </pre>
                </div>
              </div>
            </div>
          );
        })()}
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.4; } }
      `}</style>
    </div>
  );
};

export default UploadDashboard;
