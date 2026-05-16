import { useState, useRef, useEffect, type ReactNode } from 'react';
import axios from 'axios';
import { GLSLHills } from '@/components/ui/glsl-hills';
import * as d3 from 'd3';
import {
  Activity,
  AlertTriangle,
  ShieldCheck,
  Search,
  MessageSquare,
  ChevronRight,
  ArrowUpRight,
  User,
  Cpu,
  Send,
  Upload,
  X,
} from 'lucide-react';
import UploadDashboard, { type UploadResponse } from './components/UploadDashboard';
import { motion } from 'framer-motion';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api';

const getChatErrorMessage = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    const payload = error.response?.data;
    if (typeof payload === 'object' && payload !== null) {
      const detail = 'detail' in payload ? payload.detail : undefined;
      if (typeof detail === 'string' && detail.trim()) {
        return detail;
      }
      if (typeof detail === 'object' && detail !== null && 'message' in detail) {
        const message = detail.message;
        if (typeof message === 'string' && message.trim()) {
          return message;
        }
      }
    }

    if (typeof error.message === 'string' && error.message.trim()) {
      return `AI request failed: ${error.message}`;
    }
  }

  return 'Intelligence Agent is currently unavailable. Please try again in a moment.';
};


// ─── Types ─────────────────────────────────────────────────────────────────────

interface RiskData {
  vendor_id: string;
  risk_score: number;
  breakdown: {
    financial_anomalies: { split_purchases: number; duplicates: number };
    graph_compliance_issues: number;
    fraud_loop_detected: boolean;
  };
}

interface Message {
  role: 'ai' | 'user';
  text: string;
}

interface AlertItem {
  id: string;
  type: 'Financial' | 'Compliance' | 'Policy';
  msg: string;
  severity: 'high' | 'medium';
}

interface GraphNode extends d3.SimulationNodeDatum {
  id: string;
  type: string;
}

interface GraphLink extends d3.SimulationLinkDatum<GraphNode> {
  label: string;
}

const normalizeAiText = (text: string): string =>
  text
    .replace(/\s+-\s+\*\*/g, '\n- **')
    .replace(/([.!?])\s+(I can )/g, '$1\n\n$2')
    .trim();

const renderInlineMarkdown = (text: string): ReactNode[] =>
  text
    .split(/(\*\*[^*]+\*\*)/g)
    .filter(Boolean)
    .map((segment, idx) =>
      segment.startsWith('**') && segment.endsWith('**') ? (
        <strong key={`bold-${idx}`}>{segment.slice(2, -2)}</strong>
      ) : (
        <span key={`text-${idx}`}>{segment}</span>
      )
    );

const renderChatMessageText = (message: Message): ReactNode => {
  const text = message.role === 'ai' ? normalizeAiText(message.text) : message.text.trim();
  const lines = text.split('\n').map((line) => line.trim()).filter(Boolean);

  const blocks: ReactNode[] = [];
  let listItems: string[] = [];

  const flushList = (keySeed: number) => {
    if (listItems.length === 0) return;
    blocks.push(
      <ul key={`list-${keySeed}`} style={{ margin: '0 0 8px 18px', padding: 0 }}>
        {listItems.map((item, idx) => (
          <li key={`item-${keySeed}-${idx}`} style={{ marginBottom: 6 }}>
            {renderInlineMarkdown(item)}
          </li>
        ))}
      </ul>
    );
    listItems = [];
  };

  lines.forEach((line, idx) => {
    if (line.startsWith('- ')) {
      listItems.push(line.slice(2));
      return;
    }

    flushList(idx);
    blocks.push(
      <p key={`p-${idx}`} style={{ margin: '0 0 8px 0' }}>
        {renderInlineMarkdown(line)}
      </p>
    );
  });
  flushList(lines.length);

  return (
    <div style={{ fontSize: 13, lineHeight: 1.6, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
      {blocks.length > 0 ? blocks : message.text}
    </div>
  );
};

// ─── Risk Scorecard ────────────────────────────────────────────────────────────

const RiskScorecard = ({ data }: { data: RiskData }) => {
  const color =
    data.risk_score > 70
      ? 'var(--risk-high)'
      : data.risk_score > 40
      ? 'var(--risk-medium)'
      : 'var(--risk-low)';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="card"
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <p className="text-muted">Unified Risk Score</p>
          <h2 className="risk-score" style={{ color }}>
            {data.risk_score}
            <span style={{ fontSize: 16, fontWeight: 400, color: 'var(--text-muted)', marginLeft: 4 }}>/100</span>
          </h2>
        </div>
        <div className={`tag ${data.risk_score > 70 ? 'tag-red' : 'tag-amber'}`}>
          {data.risk_score > 70 ? 'Critical Alert' : 'Review Required'}
        </div>
      </div>

      <div style={{ marginTop: 24, display: 'grid', gap: 14 }}>
        {[
          {
            label: 'Financial Anomalies',
            value: data.breakdown.financial_anomalies.split_purchases + data.breakdown.financial_anomalies.duplicates,
            color: 'inherit',
          },
          {
            label: 'Compliance Breaches',
            value: data.breakdown.graph_compliance_issues,
            color: data.breakdown.graph_compliance_issues > 0 ? 'var(--risk-medium)' : 'inherit',
          },
          {
            label: 'Hidden Affiliations',
            value: data.breakdown.fraud_loop_detected ? 'DETECTED' : 'None',
            color: data.breakdown.fraud_loop_detected ? 'var(--risk-high)' : 'var(--risk-low)',
          },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="text-muted" style={{ fontSize: 13 }}>{label}</span>
            <span style={{ fontWeight: 600, color }}>{value}</span>
          </div>
        ))}
      </div>

      {/* Risk bar */}
      <div style={{ marginTop: 20, height: 4, background: 'var(--border)', borderRadius: 4, overflow: 'hidden' }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${data.risk_score}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          style={{ height: '100%', background: color, borderRadius: 4 }}
        />
      </div>
    </motion.div>
  );
};

// ─── D3 Graph Visualization ────────────────────────────────────────────────────

const GRAPH_NODES: GraphNode[] = [
  { id: 'INV-002', type: 'Invoice' },
  { id: 'V-001',   type: 'Vendor' },
  { id: 'C-100',   type: 'Contract' },
  { id: 'REG-FCPA', type: 'Regulation' },
  { id: 'A-001',   type: 'Approver' },
];

const GRAPH_LINKS: GraphLink[] = [
  { source: 'V-001',   target: 'INV-002',   label: 'ISSUES' },
  { source: 'INV-002', target: 'C-100',     label: 'REFERENCES' },
  { source: 'V-001',   target: 'REG-FCPA',  label: 'VIOLATES' },
  { source: 'INV-002', target: 'A-001',     label: 'APPROVED_BY' },
];

const NODE_COLORS: Record<string, string> = {
  Invoice:    'var(--risk-high)',
  Regulation: 'var(--risk-low)',
  Vendor:     'var(--accent)',
  Approver:   'var(--risk-medium)',
  Contract:   '#2a5570',
};

const GraphViz = () => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const el = svgRef.current;
    if (!el) return;

    const W = el.clientWidth || 600;
    const H = el.clientHeight || 380;

    // Deep-clone so D3 mutations don't bleed between renders
    const nodes: GraphNode[] = GRAPH_NODES.map((n) => ({ ...n }));
    const links: GraphLink[] = GRAPH_LINKS.map((l) => ({ ...l }));

    const svg = d3.select(el);
    svg.selectAll('*').remove();

    // Arrow marker
    svg.append('defs').append('marker')
      .attr('id', 'arrow')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 20)
      .attr('refY', 0)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-5L10,0L0,5')
      .attr('fill', '#444');

    const simulation = d3
      .forceSimulation(nodes)
      .force('link', d3.forceLink<GraphNode, GraphLink>(links).id((d) => d.id).distance(130))
      .force('charge', d3.forceManyBody().strength(-350))
      .force('center', d3.forceCenter(W / 2, H / 2))
      .force('collision', d3.forceCollide(30));

    const linkGroup = svg.append('g');
    const linkLine = linkGroup
      .selectAll<SVGLineElement, GraphLink>('line')
      .data(links)
      .join('line')
      .attr('stroke', 'rgba(14,107,168,0.3)')
      .attr('stroke-width', 1.5)
      .attr('marker-end', 'url(#arrow)');

    const linkLabel = linkGroup
      .selectAll<SVGTextElement, GraphLink>('text')
      .data(links)
      .join('text')
      .text((d) => d.label)
      .attr('fill', 'var(--text-dim)')
      .attr('font-size', 9)
      .attr('text-anchor', 'middle');

    const nodeGroup = svg
      .append('g')
      .selectAll<SVGGElement, GraphNode>('g')
      .data(nodes)
      .join('g')
      .style('cursor', 'grab')
      .call(
        d3.drag<SVGGElement, GraphNode>()
          .on('start', (event, d) => {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
          })
          .on('drag', (event, d) => { d.fx = event.x; d.fy = event.y; })
          .on('end', (event, d) => {
            if (!event.active) simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;
          })
      );

    nodeGroup.append('circle')
      .attr('r', 10)
      .attr('fill', (d) => NODE_COLORS[d.type] ?? '#888')
      .attr('stroke', '#1a1a1a')
      .attr('stroke-width', 2);

    nodeGroup.append('text')
      .text((d) => d.id)
      .attr('x', 14)
      .attr('y', 4)
      .attr('fill', 'var(--text-muted)')
      .style('font-size', '10px')
      .style('pointer-events', 'none');

    simulation.on('tick', () => {
      linkLine
        .attr('x1', (d) => (d.source as GraphNode).x ?? 0)
        .attr('y1', (d) => (d.source as GraphNode).y ?? 0)
        .attr('x2', (d) => (d.target as GraphNode).x ?? 0)
        .attr('y2', (d) => (d.target as GraphNode).y ?? 0);

      linkLabel
        .attr('x', (d) => (((d.source as GraphNode).x ?? 0) + ((d.target as GraphNode).x ?? 0)) / 2)
        .attr('y', (d) => (((d.source as GraphNode).y ?? 0) + ((d.target as GraphNode).y ?? 0)) / 2);

      nodeGroup.attr('transform', (d) => `translate(${d.x ?? 0},${d.y ?? 0})`);
    });

    return () => { simulation.stop(); };
  }, []);

  return (
    <div className="graph-container" style={{ position: 'relative' }}>
      <div style={{ position: 'absolute', top: 12, left: 12, zIndex: 1, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <span className="tag tag-red">Violation Path Detected</span>
        {Object.entries(NODE_COLORS).map(([type, color]) => (
          <span key={type} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: 'var(--text-muted)' }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: color, display: 'inline-block', boxShadow: `0 0 4px ${color}` }} />
            {type}
          </span>
        ))}
      </div>
      <svg ref={svgRef} width="100%" height="100%" />
    </div>
  );
};

// ─── Chat Interface ────────────────────────────────────────────────────────────

const ChatInterface = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'ai',
      text: 'ProcureGuard Intelligence Agent online.\n\nI can help you with:\n- Invoice compliance checks\n- Fraud loop detection\n- Contract spending-limit verification',
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || loading) return;

    setMessages((prev) => [...prev, { role: 'user', text }]);
    setInput('');
    setLoading(true);

    try {
      const response = await axios.post(`${API_BASE_URL}/ask`, { question: text });
      setMessages((prev) => [...prev, { role: 'ai', text: response.data.answer }]);
    } catch (error) {
      console.error('AI chat failed:', error);
      setMessages((prev) => [...prev, { 
        role: 'ai', 
        text: getChatErrorMessage(error),
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="chat-container">
      <div className="chat-messages">
        {messages.map((m, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className={`message ${m.role === 'ai' ? 'message-ai' : 'message-user'}`}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
              {m.role === 'ai' ? <Cpu size={12} /> : <User size={12} />}
              <span style={{ fontSize: 10, textTransform: 'uppercase', opacity: 0.5, letterSpacing: '0.05em' }}>
                {m.role === 'ai' ? 'ProcureGuard AI' : 'You'}
              </span>
            </div>
            {renderChatMessageText(m)}
          </motion.div>
        ))}

        {loading && (
          <div className="message message-ai" style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--text-muted)' }}
              />
            ))}
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      <div className="chat-input-wrapper" style={{ display: 'flex', gap: 8, marginTop: 12 }}>
        <input
          type="text"
          id="chat-input"
          placeholder="Ask about vendor risk or anomalies..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          style={{ flex: 1 }}
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || loading}
          style={{
            background: input.trim() && !loading ? 'var(--accent)' : 'var(--surface)',
            color: input.trim() && !loading ? 'var(--bg)' : 'var(--text-muted)',
            border: '1px solid var(--border)',
            borderRadius: 8,
            padding: '0 14px',
            cursor: input.trim() && !loading ? 'pointer' : 'not-allowed',
            transition: 'all 0.2s',
          }}
          aria-label="Send message"
        >
          <Send size={14} />
        </button>
      </div>
    </div>
  );
};

// ─── App ───────────────────────────────────────────────────────────────────────

const MOCK_RISK: RiskData = {
  vendor_id: 'V-001',
  risk_score: 85,
  breakdown: {
    financial_anomalies: { split_purchases: 3, duplicates: 1 },
    graph_compliance_issues: 1,
    fraud_loop_detected: true,
  },
};

const ALERTS: AlertItem[] = [
  { id: 'split-purchase', type: 'Financial',  msg: 'Three invoices of $3,500 detected under PO-999 on the same day (Split Purchase Pattern)', severity: 'high' },
  { id: 'sub-vendor-fcpa', type: 'Compliance', msg: 'Sub-vendor Offshore Logistics Ltd failed FCPA screening due to bribery allegation', severity: 'high' },
  { id: 'contract-overrun', type: 'Policy', msg: 'Total billings against Contract C-100 exceed the agreed $500k ceiling by 10%', severity: 'medium' },
];

const App = () => {
  const [riskData, setRiskData] = useState<RiskData>(MOCK_RISK);
  const [alerts, setAlerts] = useState<AlertItem[]>(ALERTS);
  const [activeSection, setActiveSection] = useState<'dashboard' | 'search' | 'incidents' | 'upload'>('dashboard');
  const [showAllAlerts, setShowAllAlerts] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [reportStatus, setReportStatus] = useState<string | null>(null);
  const [auditPreview, setAuditPreview] = useState<string[]>([]);
  const [resolvedIncidentIds, setResolvedIncidentIds] = useState<string[]>([]);
  const [isChatOpen, setIsChatOpen] = useState(false);

  useEffect(() => {
    const fetchRisk = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/risk/unified/V-001`);
        if (res.data.status === 'success') {
          setRiskData(res.data.data);
        }
      } catch (err) {
        console.error('Failed to fetch risk data:', err);
      }
    };
    fetchRisk();
  }, []);

  const handleUploadComplete = (report: UploadResponse) => {
    setRiskData((prev) => ({
      ...prev,
      risk_score: report.risk_score,
      breakdown: {
        financial_anomalies: { 
          split_purchases: report.procurement_flags.length, 
          duplicates: 0 
        },
        graph_compliance_issues: report.compliance_flags.length,
        fraud_loop_detected: report.risk_score > 80,
      }
    }));

    const newAlerts: AlertItem[] = [];
    report.procurement_flags.forEach((msg, i) => {
      newAlerts.push({
        id: `proc-${Date.now()}-${i}`,
        type: 'Financial',
        msg,
        severity: report.risk_score > 70 ? 'high' : 'medium'
      });
    });
    report.compliance_flags.forEach((msg, i) => {
      newAlerts.push({
        id: `comp-${Date.now()}-${i}`,
        type: 'Compliance',
        msg,
        severity: 'high'
      });
    });

    if (newAlerts.length > 0) {
      setAlerts((prev) => [...newAlerts, ...prev]);
    }
  };

  const normalizedQuery = searchQuery.trim().toLowerCase();
  const filteredAlerts = alerts.filter((alert) => {
    if (!normalizedQuery) return true;
    return (
      alert.type.toLowerCase().includes(normalizedQuery) ||
      alert.msg.toLowerCase().includes(normalizedQuery)
    );
  });
  const displayedAlerts = showAllAlerts ? alerts : alerts.slice(0, 1);
  const highSeverityIncidents = alerts.filter((alert) => alert.severity === 'high');

  const handleGenerateAuditReport = () => {
    const lines = [
      'ProcureGuard Audit Report',
      `Entity: ${riskData.vendor_id}`,
      `Risk Score: ${riskData.risk_score}/100`,
      '',
      'Breakdown:',
      `- Financial Anomalies: Split Purchases=${riskData.breakdown.financial_anomalies.split_purchases}, Duplicates=${riskData.breakdown.financial_anomalies.duplicates}`,
      `- Compliance Breaches: ${riskData.breakdown.graph_compliance_issues}`,
      `- Hidden Affiliations: ${riskData.breakdown.fraud_loop_detected ? 'Detected' : 'None'}`,
      '',
      'Alerts:',
      ...alerts.map((a) => `- [${a.type}] ${a.msg}`),
    ];
    setAuditPreview(lines);

    try {
      const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `procureguard-audit-${riskData.vendor_id}.txt`;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      URL.revokeObjectURL(url);
      setReportStatus('Audit report downloaded.');
    } catch {
      setReportStatus('Audit report generated in-app (download blocked by browser).');
    }

    window.setTimeout(() => setReportStatus(null), 2500);
  };

  const toggleIncidentResolved = (id: string) => {
    setResolvedIncidentIds((prev) =>
      prev.includes(id) ? prev.filter((incidentId) => incidentId !== id) : [...prev, id]
    );
  };

  const navItems = [
    { key: 'dashboard' as const, icon: <Activity size={16} />, label: 'Risk Dashboard' },
    { key: 'upload' as const, icon: <Upload size={16} />, label: 'Upload Gateway' },
    { key: 'search' as const, icon: <Search size={16} />, label: 'Intelligence Search' },
    { key: 'incidents' as const, icon: <AlertTriangle size={16} />, label: 'Incident Response' },
  ];

  const renderDashboard = () => (
    <>
      {/* ── GLSL Hero Banner ── */}
      <div style={{ position: 'relative', width: '100%', height: 220, borderRadius: 16, overflow: 'hidden', marginBottom: 32, border: '1px solid var(--border)' }}>
        <GLSLHills width="100%" height="220px" cameraZ={110} planeSize={256} speed={0.4} />
        {/* Dark gradient overlay so text is always legible */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to right, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.3) 60%, rgba(0,0,0,0.05) 100%)',
          zIndex: 2,
          display: 'flex', flexDirection: 'column', justifyContent: 'center',
          padding: '0 36px',
        }}>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: 8, opacity: 0.9 }}>ProcureGuard AI · Live Intelligence</p>
          <h2 style={{ margin: 0, fontSize: 26, fontWeight: 800, letterSpacing: '-0.5px', lineHeight: 1.25 }}>Vendor Audit: Global Tech Supplies</h2>
          <p style={{ margin: '8px 0 0', fontSize: 13, color: 'var(--text-muted)' }}>Entity ID: V-001 · Last Scan: 2 mins ago</p>
        </div>
        {/* Generate report button – floated to top-right inside hero */}
        <button
          id="audit-report-btn"
          onClick={handleGenerateAuditReport}
          style={{
            position: 'absolute', top: 18, right: 18, zIndex: 3,
            background: 'var(--accent)', color: 'var(--bg)',
            border: 'none', padding: '9px 18px', borderRadius: 8,
            fontWeight: 700, cursor: 'pointer', fontSize: 13,
            boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
          }}
        >
          Generate Audit Report
        </button>
      </div>

      {reportStatus && (
        <p className="text-muted" style={{ marginTop: -18, marginBottom: 18 }}>
          {reportStatus}
        </p>
      )}

      {auditPreview.length > 0 && (
        <div className="card" style={{ marginTop: 0 }}>
          <h3 style={{ marginTop: 0 }}>Latest Audit Report Preview</h3>
          <pre
            style={{
              margin: 0,
              whiteSpace: 'pre-wrap',
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
              fontSize: 12,
              lineHeight: 1.5,
              color: 'var(--text-muted)',
            }}
          >
            {auditPreview.join('\n')}
          </pre>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 20 }}>
        <RiskScorecard data={riskData} />
        <div className="card" style={{ padding: 16 }}>
          <h3 style={{ fontSize: 12, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.08em' }}>Supply Chain Trace</h3>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 0 }}>
            Drag nodes · Arrows show relationship direction
          </p>
          <GraphViz />
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="card"
        style={{ marginTop: 20 }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ margin: 0 }}>Recent Risk Alerts</h3>
          <button
            type="button"
            className="text-muted"
            onClick={() => setShowAllAlerts((prev) => !prev)}
            style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, cursor: 'pointer', background: 'transparent', border: 'none' }}
          >
            {showAllAlerts ? 'View Less' : 'View All'} <ChevronRight size={14} />
          </button>
        </div>

        {displayedAlerts.length > 0 ? (
          displayedAlerts.map((alert, i) => (
            <div
              key={alert.id}
              style={{
                display: 'flex', alignItems: 'center', gap: 16,
                padding: '12px 0',
                borderBottom: i < displayedAlerts.length - 1 ? '1px solid var(--border)' : 'none',
              }}
            >
              <div style={{ width: 8, height: 8, borderRadius: '50%', flexShrink: 0, background: alert.severity === 'high' ? 'var(--risk-high)' : 'var(--risk-medium)' }} />
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 14, marginBottom: 2 }}>{alert.msg}</p>
                <span className="text-muted" style={{ fontSize: 12 }}>{alert.type} · Just now</span>
              </div>
              <ArrowUpRight size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
            </div>
          ))
        ) : (
          <p className="text-muted" style={{ margin: 0 }}>No alerts available right now.</p>
        )}
      </motion.div>
    </>
  );

  const renderSearch = () => (
    <div style={{ maxWidth: 860 }}>
      <p className="label-eyebrow" style={{ marginBottom: 10 }}>RAG Intelligence</p>
      <h2 style={{ marginBottom: 4 }}>Intelligence Search</h2>
      <p className="text-muted" style={{ marginBottom: 24 }}>Search risk alerts by keyword or category.</p>

      <input
        type="text"
        placeholder="Search alerts (e.g. compliance, split purchase)..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        aria-label="Search alerts"
        style={{ marginBottom: 20 }}
      />

      <div style={{ display: 'grid', gap: 10 }}>
        {filteredAlerts.length > 0 ? (
          filteredAlerts.map((alert) => (
            <div
              key={`search-${alert.id}`}
              style={{
                background: 'var(--gradient-card)',
                border: '1px solid var(--border)',
                borderLeft: `3px solid ${alert.severity === 'high' ? 'var(--risk-high)' : 'var(--risk-medium)'}`,
                borderRadius: 10,
                padding: '14px 16px',
                transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
                cursor: 'default',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <strong style={{ fontSize: 13, color: 'var(--text)' }}>{alert.type}</strong>
                <span style={{
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  padding: '3px 10px',
                  borderRadius: 999,
                  background: alert.severity === 'high' ? 'rgba(240,68,68,0.1)' : 'rgba(245,158,11,0.1)',
                  color: alert.severity === 'high' ? 'var(--risk-high)' : 'var(--risk-medium)',
                  border: `1px solid ${alert.severity === 'high' ? 'rgba(240,68,68,0.25)' : 'rgba(245,158,11,0.25)'}`,
                }}>{alert.severity}</span>
              </div>
              <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5 }}>{alert.msg}</p>
            </div>
          ))
        ) : (
          <div style={{ padding: '32px', textAlign: 'center', borderRadius: 10, border: '1px dashed var(--border)' }}>
            <p className="text-muted" style={{ margin: 0 }}>No alerts matched your search.</p>
          </div>
        )}
      </div>
    </div>
  );

  const renderIncidents = () => (
    <div style={{ maxWidth: 860 }}>
      <p className="label-eyebrow" style={{ marginBottom: 10 }}>Live Triage</p>
      <h2 style={{ marginBottom: 4 }}>Incident Response</h2>
      <p className="text-muted" style={{ marginBottom: 24 }}>High-severity cases requiring immediate action.</p>

      <div style={{ display: 'grid', gap: 14 }}>
        {highSeverityIncidents.map((incident) => {
          const isResolved = resolvedIncidentIds.includes(incident.id);
          return (
            <div
              key={`incident-${incident.id}`}
              style={{
                background: isResolved ? 'var(--gradient-card)' : 'rgba(240,68,68,0.04)',
                border: `1px solid ${isResolved ? 'var(--border)' : 'rgba(240,68,68,0.25)'}`,
                borderLeft: `3px solid ${isResolved ? 'var(--risk-low)' : 'var(--risk-high)'}`,
                borderRadius: 10,
                padding: '16px 18px',
                opacity: isResolved ? 0.65 : 1,
                transition: 'all 0.3s ease',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <AlertTriangle size={14} color={isResolved ? 'var(--risk-low)' : 'var(--risk-high)'} />
                <strong style={{ fontSize: 13, flex: 1 }}>{incident.type}</strong>
                <span style={{
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  padding: '3px 10px',
                  borderRadius: 999,
                  background: isResolved ? 'rgba(0,229,160,0.1)' : 'rgba(240,68,68,0.1)',
                  color: isResolved ? 'var(--risk-low)' : 'var(--risk-high)',
                  border: `1px solid ${isResolved ? 'rgba(0,229,160,0.25)' : 'rgba(240,68,68,0.25)'}`,
                  boxShadow: isResolved ? '0 0 8px rgba(0,229,160,0.15)' : '0 0 8px rgba(240,68,68,0.1)',
                }}>
                  {isResolved ? 'Resolved' : 'Open'}
                </span>
              </div>
              <p style={{ margin: '0 0 12px', fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5 }}>{incident.msg}</p>
              <button
                type="button"
                onClick={() => toggleIncidentResolved(incident.id)}
                style={{
                  background: isResolved ? 'rgba(240,68,68,0.08)' : 'rgba(0,229,160,0.08)',
                  color: isResolved ? 'var(--risk-high)' : 'var(--risk-low)',
                  border: `1px solid ${isResolved ? 'rgba(240,68,68,0.2)' : 'rgba(0,229,160,0.2)'}`,
                  borderRadius: 6,
                  padding: '6px 14px',
                  cursor: 'pointer',
                  fontSize: 12,
                  fontWeight: 600,
                  letterSpacing: '0.04em',
                  transition: 'all 0.2s ease',
                }}
              >
                {isResolved ? 'Reopen Incident' : '✓ Mark as Resolved'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <>
    <div className="dashboard">
    {/* ── Sidebar ── */}
    <aside className="sidebar">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 40 }}>
        <div style={{
          width: 34, height: 34,
          background: 'var(--accent-dim)',
          border: '1px solid rgba(20,160,210,0.4)',
          borderRadius: 8,
          display: 'grid', placeItems: 'center', flexShrink: 0,
          boxShadow: '0 0 14px rgba(20,160,210,0.2)',
        }}>
          <ShieldCheck size={18} color="var(--accent-bright)" />
        </div>
        <div>
          <span style={{ fontWeight: 800, fontSize: 15, letterSpacing: '-0.4px', color: 'var(--text)' }}>ProcureGuard</span>
          <p style={{ fontSize: 10, color: 'var(--accent)', opacity: 0.7, letterSpacing: '0.12em', textTransform: 'uppercase', marginTop: 1 }}>AI Intelligence</p>
        </div>
      </div>

      <nav style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {navItems.map((item) => {
          const isActive = activeSection === item.key;
          return (
            <button
              key={item.key}
              type="button"
              className={`nav-btn${isActive ? ' active' : ''}`}
              onClick={() => setActiveSection(item.key)}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Version badge */}
      <div style={{ position: 'absolute', bottom: 24, left: 20, right: 20 }}>
        <div style={{
          padding: '8px 12px',
          borderRadius: 8,
          background: 'rgba(20,160,210,0.05)',
          border: '1px solid var(--border)',
          fontSize: 11,
          color: 'var(--text-dim)',
          display: 'flex', justifyContent: 'space-between',
        }}>
          <span>v2.0.1 · Live</span>
          <span style={{ color: 'var(--risk-low)', display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--risk-low)', display: 'inline-block', boxShadow: '0 0 6px var(--risk-low)' }} />
            Online
          </span>
        </div>
      </div>
    </aside>

    {/* ── Main Content ── */}
    <main className="main-content">
      {activeSection === 'dashboard' && renderDashboard()}
          {activeSection === 'upload' && <UploadDashboard onUploadComplete={handleUploadComplete} />}
      {activeSection === 'search' && renderSearch()}
      {activeSection === 'incidents' && renderIncidents()}
    </main>

  </div>
    <button
      type="button"
      className="chat-fab"
      onClick={() => setIsChatOpen((prev) => !prev)}
      aria-label={isChatOpen ? 'Close chat assistant' : 'Open chat assistant'}
    >
      {isChatOpen ? <X size={18} /> : <MessageSquare size={18} />}
    </button>

    {isChatOpen && (
      <section className="floating-chat-panel" aria-label="Intelligence Agent Chat">
        <div className="floating-chat-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 28, height: 28, borderRadius: 7,
              background: 'var(--accent-dim)',
              border: '1px solid rgba(20,160,210,0.3)',
              display: 'grid', placeItems: 'center',
            }}>
              <MessageSquare size={14} color="var(--accent-bright)" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: 13, fontWeight: 700 }}>Intelligence Agent</h3>
              <p style={{ margin: 0, fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.06em' }}>AI · ONLINE</p>
            </div>
          </div>
          <span
            style={{
              marginLeft: 'auto',
              marginRight: 10,
              width: 7,
              height: 7,
              borderRadius: '50%',
              background: 'var(--risk-low)'
            }}
            title="Online"
          />
          <button
            type="button"
            className="floating-chat-close"
            onClick={() => setIsChatOpen(false)}
            aria-label="Close chat assistant"
          >
            <X size={16} />
          </button>
        </div>
        <div className="floating-chat-body">
          <ChatInterface />
        </div>
      </section>
    )}
    </>
  );
};

export default App;
