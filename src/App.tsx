import { useState, useEffect } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, ComposedChart
} from 'recharts'
import { Zap, Activity, Sliders, Database, Globe, DollarSign, Droplet, Layers, ShieldCheck, ChevronRight, BookOpen, Settings, BarChart3, Plus, Trash2, CheckCircle2 } from 'lucide-react'
import './App.css'

interface DashboardStats {
  daily_revenue: number
  avg_market_price: number
  water_efficiency: string
  global_health_index: string
  peak_profit_hour: string
  operational_status: string
}

interface UsageReading {
  timestamp: string
  usage_value: number // MW
  pressure_psi: number
  temperature_c: number
  reservoir_level_m: number
  flow_rate_m3s: number
  market_price_mwh: number
  efficiency_pct: number
  vibration_mm_s: number
  excitation_v: number
}

interface MaintenanceLog {
  id: number
  date: string
  event_type: string
  description: string
  is_global_trend: boolean
}

function App() {
  const [activeTab, setActiveTab] = useState('executive') // executive, operator, maintenance
  const [execStats, setExecStats] = useState<DashboardStats | null>(null)
  const [latestTelemetry, setLatestTelemetry] = useState<UsageReading | null>(null)
  const [recommendation, setRecommendation] = useState<any>(null)
  const [maintenanceLogs, setMaintenanceLogs] = useState<MaintenanceLog[]>([])
  const [chartData, setChartData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // AI Training Module State
  const [trainingSubTab, setTrainingSubTab] = useState<'rules' | 'contracts' | 'units'>('rules')
  const [aiAnalysis, setAiAnalysis] = useState<{ reasoning: string, show: boolean }>({ reasoning: '', show: false })
  const [teachInput, setTeachInput] = useState('')
  const [contractBands, setContractBands] = useState<any[]>([])
  const [meters, setMeters] = useState<any[]>([])
  const [selectedMeterId, setSelectedMeterId] = useState<number | null>(null)
  const [incidents, setIncidents] = useState<any[]>([])
  const [incidentForm, setIncidentForm] = useState({ reporter: '', severity: 'Medium', category: 'Mechanical', description: '' })

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        // Executive Stats
        const execRes = await fetch(`${API_URL}/dashboard/executive`)
        setExecStats(await execRes.json())

        // Telemetry
        const usageRes = await fetch(`${API_URL}/usage?days=1`)
        const usageData = await usageRes.json()
        if (usageData.length > 0) {
          setLatestTelemetry(usageData[usageData.length - 1])
          setChartData(usageData.slice(-24).map((r: any) => ({
            time: new Date(r.timestamp).getHours() + ":00",
            mw: r.usage_value,
            price: r.market_price_mwh,
            efficiency: r.efficiency_pct
          })))
        }

        // Recommendations
        const recRes = await fetch(`${API_URL}/recommendations?meter_id=1`)
        setRecommendation(await recRes.json())

        // Maintenance Logs
        const logRes = await fetch(`${API_URL}/maintenance/logs`)
        setMaintenanceLogs(await logRes.json())

        // Contractual Bands
        const bandsRes = await fetch(`${API_URL}/config/contractual-bands`)
        setContractBands(await bandsRes.json())

        // Meters (Units)
        const metersRes = await fetch(`${API_URL}/meters`)
        const metersData = await metersRes.json()
        setMeters(metersData)
        if (metersData.length > 0) setSelectedMeterId(metersData[0].id)

        // Incidents
        const incidentRes = await fetch(`${API_URL}/operator/incidents`)
        setIncidents(await incidentRes.json())

      } catch (e) {
        console.error("Fetch error", e)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
    const interval = setInterval(fetchData, 10000)
    return () => clearInterval(interval)
  }, [API_URL])

  const submitIncident = async () => {
    if (!incidentForm.reporter || !incidentForm.description) {
      alert("Please fill in reporter name and description.");
      return;
    }
    const res = await fetch(`${API_URL}/operator/incidents`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        reporter_name: incidentForm.reporter,
        severity: incidentForm.severity,
        category: incidentForm.category,
        description: incidentForm.description,
        meter_id: selectedMeterId || 1 
      })
    });
    if (res.ok) {
      alert("Incident reported successfully.");
      setIncidentForm({ reporter: '', severity: 'Medium', category: 'Mechanical', description: '' });
      const incidentRes = await fetch(`${API_URL}/operator/incidents`);
      setIncidents(await incidentRes.json());
    } else {
      const errorData = await res.json();
      console.error("Incident report failed:", errorData);
      alert(`Submission failed: ${JSON.stringify(errorData.detail)}`);
    }
  };

  const getAlarms = () => {
    const alarms = [];
    if (!latestTelemetry) return [];
    if (latestTelemetry.vibration_mm_s > 4.5) alarms.push({ type: 'CRITICAL', msg: 'Vibration Threshold Critical (>4.5mm/s)' });
    else if (latestTelemetry.vibration_mm_s > 2.0) alarms.push({ type: 'WARNING', msg: 'Elevated Vibration Signature' });
    if (latestTelemetry.temperature_c > 80) alarms.push({ type: 'CRITICAL', msg: 'Winding Temperature Critical (>80°C)' });
    else if (latestTelemetry.temperature_c > 65) alarms.push({ type: 'WARNING', msg: 'High Thermal Gradient' });
    if (latestTelemetry.pressure_psi < 35) alarms.push({ type: 'CRITICAL', msg: 'Oil Pressure Lost (<35 PSI)' });
    else if (latestTelemetry.pressure_psi < 45) alarms.push({ type: 'WARNING', msg: 'Lubrication Pressure Low' });
    return alarms;
  };

  const renderExecutiveView = () => (
    <div className="fade-in">
      <div className="grid">
        <div className="card stat-card gold-border">
          <div className="card-header"><DollarSign color="#fbbf24" /> <h3>Daily Revenue Intelligence</h3></div>
          <div className="stat-value">$ {execStats?.daily_revenue?.toLocaleString() ?? 0}</div>
          <p className="card-footer">Peak Hour: {execStats?.peak_profit_hour}</p>
        </div>
        <div className="card stat-card blue-border">
          <div className="card-header"><Droplet color="#38bdf8" /> <h3>Water Utilization Efficiency</h3></div>
          <div className="stat-value">{execStats?.water_efficiency}</div>
          <p className="card-footer">Optimization: Maximum Aprovechamiento</p>
        </div>
        <div className="card stat-card green-border">
          <div className="card-header"><ShieldCheck color="#10b981" /> <h3>Global Fleet Health Index</h3></div>
          <div className="stat-value">{execStats?.global_health_index}</div>
          <p className="card-footer">Status: {execStats?.operational_status}</p>
        </div>
      </div>

      <div className="card large-chart-card" style={{ marginTop: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3>Operational Revenue vs. Efficiency (24h Trend)</h3>
          <div className="chart-legend">
            <span style={{ color: '#fbbf24' }}>● Market Price</span>
            <span style={{ color: '#38bdf8', marginLeft: '1rem' }}>● Generation Efficiency</span>
          </div>
        </div>
        <div style={{ height: '350px', width: '100%', marginTop: '1.5rem' }}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData}>
              <XAxis dataKey="time" hide />
              <YAxis yAxisId="left" hide />
              <YAxis yAxisId="right" orientation="right" hide />
              <Tooltip />
              <Area yAxisId="left" type="monotone" dataKey="price" fill="#fbbf24" stroke="#fbbf24" fillOpacity={0.1} name="Market Price ($)" />
              <Line yAxisId="right" type="monotone" dataKey="efficiency" stroke="#38bdf8" strokeWidth={3} dot={false} name="Efficiency (%)" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )

  const renderOperatorView = () => (
    <div className="fade-in">
      {getAlarms().length > 0 && (
        <div className="alarm-section" style={{ marginBottom: '2rem' }}>
          {getAlarms().map((alarm, i) => (
            <div key={i} className={`card alarm-badge ${alarm.type === 'CRITICAL' ? 'alarm-critical' : 'alarm-warning'}`} style={{ marginBottom: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span><strong>{alarm.type}:</strong> {alarm.msg}</span>
              <Activity size={16} />
            </div>
          ))}
        </div>
      )}
      <div className="grid-2-1">
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3>Unit TGU-01-A Real-Time SCADA</h3>
            <span className="live-tag">LIVE TELEMETRY</span>
          </div>
          <div className="scada-grid">
            <div className="scada-item">
              <span className="label">POWER OUTPUT</span>
              <span className="value">{latestTelemetry?.usage_value?.toFixed(1) ?? "0.0"} MW</span>
              <div className="progress-bar"><div className="fill" style={{ width: `${(latestTelemetry?.usage_value || 0) * 1.5}%` }}></div></div>
            </div>
            <div className="scada-item">
              <span className="label">RESERVOIR LEVEL</span>
              <span className="value">{latestTelemetry?.reservoir_level_m?.toFixed(2) ?? "0.00"} m</span>
              <div className="progress-bar blue"><div className="fill" style={{ width: '80%' }}></div></div>
            </div>
            <div className="scada-item">
              <span className="label">VIBRATION</span>
              <span className="value">{latestTelemetry?.vibration_mm_s?.toFixed(2) ?? "0.00"} mm/s</span>
              <div className="progress-bar green"><div className="fill" style={{ width: `${(latestTelemetry?.vibration_mm_s || 0) * 20}%` }}></div></div>
            </div>
            <div className="scada-item">
              <span className="label">MARKET PRICE</span>
              <span className="value">$ {latestTelemetry?.market_price_mwh?.toFixed(2) ?? "0.00"} /MWh</span>
              <div className="progress-bar gold"><div className="fill" style={{ width: '60%' }}></div></div>
            </div>
          </div>
        </div>

        <div className="card recommendation-card animate-pulse">
          <div className="card-header"><Activity color="#f43f5e" /> <h3>AI Smart Dispatch</h3></div>
          <div className="rec-content">
            <p className="rec-label">RECOMMENDED SETPOINT (CONSIGNA)</p>
            <div className="rec-value">{recommendation?.target_setpoint?.toFixed(1) ?? "0.0"} MW</div>
            <p className="rec-reasoning">{recommendation?.reasoning}</p>
            <button className="apply-btn">APPLY CONSIGNA TO SCADA</button>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: '2rem' }}>
        <h3>Hydrological & Mechanical Correlation</h3>
        <div style={{ height: '300px', width: '100%', marginTop: '1.5rem' }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
              <XAxis dataKey="time" hide />
              <YAxis hide />
              <Tooltip />
              <Line type="monotone" dataKey="mw" stroke="#38bdf8" strokeWidth={4} dot={false} name="Actual Load (MW)" />
              <Line type="monotone" dataKey="price" stroke="#fbbf24" strokeWidth={2} strokeDasharray="5 5" dot={false} name="Price Opportunity" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid-2-1" style={{ marginTop: '2rem' }}>
        <div className="card incident-card">
          <h3>Active Plant Incidents</h3>
          <div className="log-list" style={{ maxHeight: '400px', overflowY: 'auto' }}>
            {incidents.length === 0 ? <p className="card-footer">No active incidents reported.</p> :
              incidents.map((inc: any) => (
                <div key={inc.id} className="log-item">
                  <div className="log-icon"><ShieldCheck size={16} color={inc.severity === 'Critical' ? '#f43f5e' : '#fbbf24'} /></div>
                  <div className="log-details">
                    <span className="log-date">{new Date(inc.created_at).toLocaleString()} - <span className={`severity-${inc.severity}`}>{inc.severity}</span></span>
                    <p><strong>{inc.category}</strong>: {inc.description}</p>
                    <span className="card-footer">Reported by: {inc.reporter_name}</span>
                  </div>
                </div>
              ))
            }
          </div>
        </div>

        <div className="card">
          <h3>Report New Incident</h3>
          <div className="form-group">
            <label>Reporter Name</label>
            <input type="text" className="form-input" value={incidentForm.reporter} onChange={(e) => setIncidentForm({...incidentForm, reporter: e.target.value})} />
          </div>
          <div className="incident-form-grid">
            <div className="form-group">
              <label>Severity</label>
              <select className="form-select" value={incidentForm.severity} onChange={(e) => setIncidentForm({...incidentForm, severity: e.target.value})}>
                <option>Low</option>
                <option>Medium</option>
                <option>High</option>
                <option>Critical</option>
              </select>
            </div>
            <div className="form-group">
              <label>Category</label>
              <select className="form-select" value={incidentForm.category} onChange={(e) => setIncidentForm({...incidentForm, category: e.target.value})}>
                <option>Mechanical</option>
                <option>Electrical</option>
                <option>Hydrological</option>
                <option>Operational</option>
              </select>
            </div>
          </div>
          <div className="form-group">
            <label>Detailed Description</label>
            <textarea className="form-textarea" placeholder="Describe the anomaly or event..." value={incidentForm.description} onChange={(e) => setIncidentForm({...incidentForm, description: e.target.value})} />
          </div>
          <button className="btn-primary" style={{ width: '100%' }} onClick={submitIncident}>SUBMIT INCIDENT REPORT</button>
        </div>
      </div>
    </div>
  )

  const renderTrainingView = () => (
    <div className="fade-in">
      <div className="training-grid">
        <aside className="sub-nav">
          <div className={`sub-nav-link ${trainingSubTab === 'rules' ? 'active' : ''}`} onClick={() => setTrainingSubTab('rules')}>
            <ShieldCheck size={18} /> Rules Verification
          </div>
          <div className={`sub-nav-link ${trainingSubTab === 'contracts' ? 'active' : ''}`} onClick={() => setTrainingSubTab('contracts')}>
            <BarChart3 size={18} /> Contractual Config
          </div>
          <div className={`sub-nav-link ${trainingSubTab === 'units' ? 'active' : ''}`} onClick={() => setTrainingSubTab('units')}>
            <Settings size={18} /> Generating Units
          </div>
        </aside>

        <section className="training-content">
          {trainingSubTab === 'rules' && renderRulesSubmodule()}
          {trainingSubTab === 'contracts' && renderContractsSubmodule()}
          {trainingSubTab === 'units' && renderUnitsSubmodule()}
        </section>
      </div>
    </div>
  )

  const renderRulesSubmodule = () => (
    <div className="card">
      <h3>AI Diagnostic & Training (Rules)</h3>
      <p className="card-footer" style={{ marginBottom: '2rem' }}>Modify live SCADA parameters to simulate scenarios and teach the AI.</p>
      
      <div className="scada-grid">
        <div className="form-group">
          <label>Bearing Temperature (°C)</label>
          <input type="number" className="form-input" defaultValue={latestTelemetry?.temperature_c} />
        </div>
        <div className="form-group">
          <label>Oil Pressure (PSI)</label>
          <input type="number" className="form-input" defaultValue={latestTelemetry?.pressure_psi} />
        </div>
        <div className="form-group">
          <label>Vibration (mm/s)</label>
          <input type="number" className="form-input" defaultValue={latestTelemetry?.vibration_mm_s} />
        </div>
        <div className="form-group">
          <label>Excitation (V)</label>
          <input type="number" className="form-input" defaultValue={latestTelemetry?.excitation_v} />
        </div>
      </div>

      <button className="btn-primary" onClick={() => setAiAnalysis({ reasoning: "Analyzing historical correlations and real-time SCADA delta...", show: true })}>
        TEACH AI (ANALYZE SCENARIO)
      </button>

      {aiAnalysis.show && (
        <div className="ai-reasoning-panel fade-in">
          <h4>AI Reasoning Output</h4>
          <p>{aiAnalysis.reasoning}</p>
          <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
            <button className="btn-primary btn-proven" onClick={async () => {
              const res = await fetch(`${API_URL}/training/teach`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ parameter_name: 'Simulated Scenario', scenario_value: 0, ai_reasoning: aiAnalysis.reasoning, is_validated: true })
              });
              if (res.ok) {
                alert("AI model updated: Logic validated as PROVEN.");
                setAiAnalysis({ ...aiAnalysis, show: false });
              }
            }}>
              <CheckCircle2 size={16} /> PROVEN
            </button>
            <button className="btn-primary btn-add-rule" onClick={async () => {
              const res = await fetch(`${API_URL}/training/teach`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                  parameter_name: 'Custom Rule', 
                  scenario_value: 0, 
                  ai_reasoning: aiAnalysis.reasoning, 
                  user_explanation: teachInput,
                  is_validated: false 
                })
              });
              if (res.ok) {
                alert("New AI Rule Added based on operator expertise.");
                setAiAnalysis({ ...aiAnalysis, show: false });
                setTeachInput('');
              }
            }}>
              <Plus size={16} /> ADD RULE
            </button>
          </div>
          
          <div style={{ marginTop: '2rem' }}>
            <label className="rec-label" style={{ color: 'var(--primary)' }}>TEACH EXPLANATION (ROOT CAUSE)</label>
            <textarea 
              className="form-textarea" 
              placeholder="Explain why this happened... (e.g., Cascading effect of low oil pressure on bearing temperature)"
              value={teachInput}
              onChange={(e) => setTeachInput(e.target.value)}
            />
          </div>
        </div>
      )}
    </div>
  )

  const renderContractsSubmodule = () => (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h3>Contractual Energy Bands (24h)</h3>
        <button className="btn-primary"><Plus size={16} /> ADD CONTRACTUAL RANGE</button>
      </div>

      <div className="dual-axis-chart">
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={[...Array(24)].map((_, i) => ({ hour: i, power: 50 + Math.random() * 20, price: i > 10 && i < 18 ? 80 : 45 }))}>
            <XAxis dataKey="hour" hide />
            <YAxis hide />
            <Tooltip />
            <Area type="stepAfter" dataKey="price" stroke="#fbbf24" fill="#fbbf24" fillOpacity={0.2} name="Contract Price ($/MWh)" />
            <Area type="monotone" dataKey="power" stroke="#38bdf8" fill="#38bdf8" fillOpacity={0.1} name="Power Limit (MW)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="log-list">
        {contractBands.map((band: any) => (
          <div key={band.id} className="log-item">
            <div className="log-icon" style={{ backgroundColor: band.band_type === 'Energy' ? 'rgba(251,191,36,0.1)' : 'rgba(56,189,248,0.1)' }}>
              <BarChart3 size={16} />
            </div>
            <div className="log-details">
              <span className="log-date">{band.band_type} Band: {band.start_hour}:00 - {band.end_hour}:00</span>
              <p className="log-desc">Price: ${band.price_kwh}/MWh | Priority: High</p>
            </div>
            <Trash2 className="nav-link" size={18} style={{ color: 'var(--danger)', marginLeft: 'auto' }} />
          </div>
        ))}
      </div>
    </div>
  )

  const renderUnitsSubmodule = () => (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h3>Generating Units (UG) Configuration</h3>
        <button className="btn-primary"><Plus size={16} /> ADD GENERATING UNIT</button>
      </div>

      <div className="form-group">
        <label>Select Unit to Edit</label>
        <select className="form-select" value={selectedMeterId || ''} onChange={(e) => setSelectedMeterId(Number(e.target.value))}>
          {meters.map((m: any) => <option key={m.id} value={m.id}>{m.serial_number} ({m.meter_type})</option>)}
        </select>
      </div>

      <div style={{ marginTop: '2rem' }}>
        <h4>SCADA Parameter Mapping</h4>
        <div className="checkbox-group">
          {['Active Power', 'Reactive Power', 'Voltage', 'Frequency', 'Oil Pressure', 'Bearing Temp', 'Winding Temp', 'Flow Rate', 'Reservoir Level', 'Vibration'].map(p => (
            <label key={p} className="checkbox-item">
              <input type="checkbox" defaultChecked /> {p}
            </label>
          ))}
        </div>
      </div>

      <div className="grid" style={{ marginTop: '2rem' }}>
        <div className="form-group">
          <label>Rated Power (MW)</label>
          <input type="number" className="form-input" placeholder="e.g., 25.5" />
        </div>
        <div className="form-group">
          <label>Turbine Type</label>
          <select className="form-select">
            <option>Francis</option>
            <option>Kaplan</option>
            <option>Pelton</option>
          </select>
        </div>
        <div className="form-group">
          <label>Unit Orientation</label>
          <select className="form-select">
            <option>Vertical</option>
            <option>Horizontal</option>
          </select>
        </div>
      </div>

      <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem' }}>
        <button className="btn-primary" onClick={async () => {
          const res = await fetch(`${API_URL}/meters/${selectedMeterId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ turbine_type: 'Francis', rated_power_mw: 25.5 }) // Mock save for now
          });
          if (res.ok) alert("Generating Unit configuration updated successfully.");
        }}>
          SAVE CONFIGURATION
        </button>
        <button className="btn-secondary" onClick={() => alert("OCR Module starting... Align camera with turbine nameplate.")}>
          IMPORT FROM NAMEPLATE (OCR)
        </button>
      </div>
    </div>
  )

  const renderMaintenanceView = () => (
    <div className="fade-in">
      <div className="card gradient-card">
        <div className="card-header"><Globe color="#fff" /> <h3 style={{ color: '#fff' }}>Global Intelligence Network</h3></div>
        <p style={{ color: 'rgba(255,255,255,0.8)' }}>Your plant is integrated with the <strong>Global Hydro Sentinel</strong>. We cross-reference your turbine vibration and thermal signatures with 1,200 similar plants worldwide.</p>
      </div>

      <div className="grid-maintenance" style={{ marginTop: '2rem' }}>
        <div className="card">
          <h3>Digitized Historical Logs (Paper to AI)</h3>
          <div className="log-list">
            {maintenanceLogs.map(log => (
              <div key={log.id} className="log-item">
                <div className="log-icon"><Database size={16} /></div>
                <div className="log-details">
                  <span className="log-date">{new Date(log.date).toLocaleDateString()} - {log.event_type}</span>
                  <p className="log-desc">{log.description}</p>
                  {log.is_global_trend && <span className="global-badge">Global Verified</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="card">
          <h3>Failure Prediction Analysis</h3>
          <div className="prediction-meter">
            <div className="meter-ring">
              <div className="meter-value">22%</div>
            </div>
            <p>Probability of Catastrophic Bearing Failure in next 180 days.</p>
            <button className="nav-link active" style={{ width: '100%', marginTop: '1rem', border: 'none' }}>Plan Preventive Maintenance</button>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <div className="app">
      <header>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="logo-container">
            <Zap size={32} color="#38bdf8" />
            <h2 style={{ margin: 0, letterSpacing: '1px' }}>HYDRO DECISION AI</h2>
          </div>
          <nav>
            <span className={`nav-link ${activeTab === 'executive' ? 'active' : ''}`} onClick={() => setActiveTab('executive')}>
              <Layers size={18} /> Executive Panel
            </span>
            <span className={`nav-link ${activeTab === 'operator' ? 'active' : ''}`} onClick={() => setActiveTab('operator')}>
              <Sliders size={18} /> Operator Terminal
            </span>
            <span className={`nav-link ${activeTab === 'maintenance' ? 'active' : ''}`} onClick={() => setActiveTab('maintenance')}>
              <Globe size={18} /> Global Strategy
            </span>
            <span className={`nav-link ${activeTab === 'training' ? 'active' : ''}`} onClick={() => setActiveTab('training')}>
              <BookOpen size={18} /> AI Training
            </span>
          </nav>
        </div>
      </header>

      <section className="hero compact">
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <h1>{activeTab === 'executive' ? 'Fleet Performance & Profitability' : activeTab === 'operator' ? 'Real-Time Dispatch Optimization' : activeTab === 'training' ? 'AI Knowledge & Config' : 'Global Failure Prediction Network'}</h1>
            <p>Strategic Intelligence for the Modern Power Grid.</p>
          </div>
          <div className="breadcrumb">
            Hydro AI <ChevronRight size={14} /> {activeTab.toUpperCase()}
          </div>
        </div>
      </section>

      <main className="container">
        {loading ? (
          <div className="loader-container">
            <div className="loader"></div>
            <p>Synchronizing with SCADA & Global Intelligence...</p>
          </div>
        ) : (
          activeTab === 'executive' ? renderExecutiveView() :
            activeTab === 'operator' ? renderOperatorView() :
              activeTab === 'training' ? renderTrainingView() :
                renderMaintenanceView()
        )}
      </main>

      <footer>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', opacity: 0.6 }}>
          <p>© 2026 HYDRO GEN INTELLIGENCE</p>
          <p>Integrated SCADA v4.2.1 • Global Sync Active</p>
        </div>
      </footer>
    </div>
  )
}

export default App
