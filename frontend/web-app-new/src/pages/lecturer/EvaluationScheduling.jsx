import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import LecturerNavbar from "./LecturerNavbar";
import { getApiBaseUrl } from "../../utils/apiBase";
import { appConfirm } from "../../components/UIFeedback/appNotify";

const BASE    = `${getApiBaseUrl()}/api/evaluation-scheduling`;
const USER_ID = 1;
let authInterceptorAttached = false;

const getAuthToken = () => {
    try {
        return typeof localStorage !== "undefined"
            ? localStorage.getItem("auth_token")
            : null;
    } catch {
        return null;
    }
};

if (!authInterceptorAttached) {
    axios.interceptors.request.use((config) => {
        const token = getAuthToken();
        if (token) {
            config.headers = config.headers || {};
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    });
    authInterceptorAttached = true;
}

// ── CSS tokens ───────────────────────────────────────────────────────
const T = {
    navy:"#1a2b4a", blue:"#2563eb", blueHov:"#1d4ed8", blueL:"#eff6ff",
    orange:"#f97316", orangeBg:"#fff7ed",
    text:"#111827", text2:"#6b7280", text3:"#9ca3af",
    border:"#e5e7eb", border2:"#d1d5db",
    bg:"#f9fafb", white:"#ffffff",
    red:"#ef4444", redBg:"#fef2f2",
    green:"#16a34a", greenBg:"#f0fdf4",
    yellow:"#d97706", yellowBg:"#fffbeb",
};
const shadow = "0 1px 3px rgba(0,0,0,0.08),0 1px 2px rgba(0,0,0,0.04)";
const radius = "10px";
const mono   = "'DM Mono',monospace";
const font   = "'DM Sans',sans-serif";

// ── Helpers ──────────────────────────────────────────────────────────
const fmtTime = (val) => {
    if (!val) return "—";
    if (val instanceof Date) {
        return `${String(val.getHours()).padStart(2,"0")}:${String(val.getMinutes()).padStart(2,"0")}`;
    }
    const s = String(val);
    const isoMatch   = s.match(/T(\d{2}:\d{2})/);
    if (isoMatch)   return isoMatch[1];
    const plainMatch = s.match(/^(\d{2}:\d{2})/);
    if (plainMatch) return plainMatch[1];
    return "—";
};
const toMins = (t) => { const [h, m] = t.split(":").map(Number); return h * 60 + m; };

// ── Primitives ───────────────────────────────────────────────────────
const Badge = ({ color = "blue", children }) => {
    const map = {
        blue:   { bg: T.blueL,    color: T.blue   },
        green:  { bg: T.greenBg,  color: T.green  },
        red:    { bg: T.redBg,    color: T.red    },
        yellow: { bg: T.yellowBg, color: T.yellow },
        gray:   { bg: "#f3f4f6",  color: "#6b7280"},
    };
    const s = map[color] || map.blue;
    return (
        <span style={{ display:"inline-flex", alignItems:"center", gap:5, padding:"3px 10px",
                       borderRadius:20, fontSize:11.5, fontWeight:600, background:s.bg, color:s.color }}>
            <span style={{ fontSize:14, lineHeight:1 }}>•</span>{children}
        </span>
    );
};

const Btn = ({ variant = "primary", size = "md", disabled, onClick, children, style }) => {
    const sz = { md:{padding:"9px 18px",fontSize:13.5}, sm:{padding:"6px 13px",fontSize:12.5,borderRadius:7}, xs:{padding:"4px 10px",fontSize:11.5,borderRadius:6} }[size];
    const v  = {
        primary:{ background:T.blue, color:"#fff", border:"none" },
        outline:{ background:"#fff", color:T.blue, border:`1.5px solid ${T.blue}` },
        ghost:  { background:"#fff", color:T.text2,border:`1.5px solid ${T.border2}` },
        danger: { background:"#fff", color:T.red,  border:"1.5px solid #fca5a5" },
    }[variant];
    return (
        <button onClick={onClick} disabled={disabled}
            style={{ display:"inline-flex", alignItems:"center", gap:6, borderRadius:8,
                     fontWeight:600, cursor:disabled?"not-allowed":"pointer", border:"none",
                     fontFamily:font, opacity:disabled?0.45:1, transition:"all .15s", ...sz, ...v, ...style }}>
            {children}
        </button>
    );
};

const Card       = ({ children, style }) => (
    <div style={{ background:T.white, border:`1px solid ${T.border}`, borderRadius:radius,
                  boxShadow:shadow, marginBottom:24, overflow:"hidden", ...style }}>{children}</div>
);
const CardHeader = ({ title, sub, right }) => (
    <div style={{ padding:"18px 22px", borderBottom:`1px solid ${T.border}`,
                  display:"flex", alignItems:"center", justifyContent:"space-between", gap:12 }}>
        <div>
            <div style={{ fontSize:15, fontWeight:700, color:T.text }}>{title}</div>
            {sub && <div style={{ fontSize:12.5, color:T.text2, marginTop:2 }}>{sub}</div>}
        </div>
        {right && <div>{right}</div>}
    </div>
);
const CardBody   = ({ children, style }) => <div style={{ padding:22, ...style }}>{children}</div>;

const FG = ({ label, required, hint, children }) => (
    <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
        <label style={{ fontSize:12.5, fontWeight:600, color:T.text }}>
            {label}{required && <span style={{ color:T.red, marginLeft:2 }}>*</span>}
        </label>
        {children}
        {hint && <span style={{ fontSize:11.5, color:T.text3 }}>{hint}</span>}
    </div>
);
const Input  = (props) => (
    <input {...props} style={{ border:`1.5px solid ${T.border2}`, borderRadius:7, padding:"9px 12px",
                               fontSize:13.5, fontFamily:font, color:T.text, background:T.white,
                               outline:"none", width:"100%", boxSizing:"border-box", ...props.style }}/>
);
const Select = ({ children, ...props }) => (
    <select {...props} style={{ border:`1.5px solid ${T.border2}`, borderRadius:7, padding:"9px 12px",
                                fontSize:13.5, fontFamily:font, color:T.text, background:T.white,
                                cursor:"pointer", outline:"none", width:"100%", boxSizing:"border-box" }}>
        {children}
    </select>
);
const Alert = ({ type = "info", icon, children }) => {
    const map = {
        info:   { bg:T.blueL,    border:"#bfdbfe", color:"#1e40af" },
        warning:{ bg:T.yellowBg, border:"#fde68a", color:"#92400e" },
        success:{ bg:T.greenBg,  border:"#bbf7d0", color:"#166534" },
    }[type] || { bg:T.blueL, border:"#bfdbfe", color:"#1e40af" };
    return (
        <div style={{ display:"flex", alignItems:"flex-start", gap:10, padding:"12px 14px", borderRadius:8,
                      fontSize:13, lineHeight:1.5, marginBottom:16,
                      background:map.bg, border:`1px solid ${map.border}`, color:map.color }}>
            <span style={{ fontSize:16, flexShrink:0 }}>{icon}</span><span>{children}</span>
        </div>
    );
};
const Toggle    = ({ on = true }) => (
    <div style={{ width:42, height:24, borderRadius:12, background:on?T.blue:T.border2,
                  position:"relative", cursor:"pointer", flexShrink:0 }}>
        <div style={{ position:"absolute", top:3, [on?"right":"left"]:3, width:18, height:18,
                      borderRadius:"50%", background:"white", boxShadow:"0 1px 3px rgba(0,0,0,.2)" }}/>
    </div>
);
const ToggleRow = ({ label, desc, on = true }) => (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
                  padding:"12px 14px", background:T.bg, border:`1px solid ${T.border}`, borderRadius:8 }}>
        <div>
            <div style={{ fontSize:13, fontWeight:600 }}>{label}</div>
            <div style={{ fontSize:12, color:T.text2, marginTop:2 }}>{desc}</div>
        </div>
        <Toggle on={on}/>
    </div>
);
const ConflictStatus = ({ ok }) => (
    <div style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 14px", borderRadius:8,
                  fontSize:13, fontWeight:500, marginBottom:14,
                  background:ok?T.greenBg:T.redBg, color:ok?T.green:T.red,
                  border:`1px solid ${ok?"#86efac":"#fca5a5"}` }}>
        <span style={{ fontSize:15 }}>{ok?"✓":"✗"}</span>
        {ok ? "Conflict Status: No Conflict Detected" : "Conflict Status: Unresolved Conflicts — Publishing Blocked"}
    </div>
);
const FilterBar  = ({ children }) => (
    <div style={{ display:"flex", alignItems:"center", gap:10, padding:"14px 22px",
                  borderBottom:`1px solid ${T.border}`, background:"#fcfcfd", flexWrap:"wrap" }}>
        {children}
    </div>
);
const SearchWrap = ({ placeholder, value, onChange }) => (
    <div style={{ position:"relative", flex:1, minWidth:200, maxWidth:320 }}>
        <span style={{ position:"absolute", left:10, top:"50%", transform:"translateY(-50%)", color:T.text3, fontSize:15 }}>🔍</span>
        <Input placeholder={placeholder} value={value} onChange={onChange} style={{ paddingLeft:34 }}/>
    </div>
);
const FilterBtn = ({ children }) => (
    <button style={{ display:"flex", alignItems:"center", gap:6, padding:"8px 14px",
                     border:`1.5px solid ${T.border2}`, borderRadius:7, background:"white",
                     fontSize:13, fontWeight:500, cursor:"pointer", color:T.text2, fontFamily:font }}>
        {children}
    </button>
);
const Th     = ({ children }) => (
    <th style={{ textAlign:"left", fontSize:11, fontWeight:700, color:T.text2, textTransform:"uppercase",
                 letterSpacing:.6, padding:"10px 16px", borderBottom:`1px solid ${T.border}`, background:T.bg }}>
        {children}
    </th>
);
const Td     = ({ children, mono: m, style }) => (
    <td style={{ padding:"14px 16px", fontSize:m?12.5:13.5, verticalAlign:"middle",
                 fontFamily:m?mono:font, color:m?T.text2:T.text, ...style }}>{children}</td>
);
const TdMain = ({ main, sub }) => (
    <td style={{ padding:"14px 16px", verticalAlign:"middle" }}>
        <div style={{ fontWeight:600, color:T.text }}>{main}</div>
        {sub && <div style={{ fontSize:12, color:T.text2, marginTop:2 }}>{sub}</div>}
    </td>
);
const Divider     = () => <hr style={{ border:"none", borderTop:`1px solid ${T.border}`, margin:"18px 0" }}/>;
const ScreenLabel = ({ num, label, style }) => (
    <div style={{ fontSize:11, fontFamily:mono, color:T.text3, marginBottom:8,
                  display:"flex", alignItems:"center", gap:6, ...style }}>
        <strong style={{ color:T.blue }}>{num}</strong>{label}
    </div>
);
const PageHeader  = ({ title, sub, right, style }) => (
    <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between",
                  marginBottom:28, gap:16, ...style }}>
        <div>
            <h1 style={{ fontSize:22, fontWeight:700, color:T.text, margin:0 }}>{title}</h1>
            {sub && <p style={{ fontSize:13, color:T.text2, marginTop:4, lineHeight:1.5, margin:0 }}>{sub}</p>}
        </div>
        {right && <div style={{ display:"flex", gap:8, alignItems:"center", flexShrink:0 }}>{right}</div>}
    </div>
);
const ConflictCard = ({ resolved, icon, title, desc, action }) => (
    <div style={{ border:`1px solid ${resolved?"#86efac":"#fca5a5"}`, borderRadius:9, padding:"14px 16px",
                  background:resolved?T.greenBg:T.redBg, display:"flex", gap:12, marginBottom:12 }}>
        <span style={{ fontSize:18, flexShrink:0, marginTop:1 }}>{icon}</span>
        <div style={{ flex:1 }}>
            <div style={{ fontSize:13, fontWeight:700, color:resolved?T.green:T.red }}>{title}</div>
            <div style={{ fontSize:12.5, color:T.text2, marginTop:3, lineHeight:1.5 }}>{desc}</div>
            <div style={{ display:"flex", gap:8, marginTop:10, alignItems:"center" }}>
                {action}<Badge color={resolved?"green":"red"}>{resolved?"Resolved":"Unresolved"}</Badge>
            </div>
        </div>
    </div>
);

// ── Flash message ────────────────────────────────────────────────────
const Flash = ({ msg, type, onDismiss }) => {
    useEffect(() => {
        if (!msg) return;
        const t = setTimeout(onDismiss, 3500);
        return () => clearTimeout(t);
    }, [msg, onDismiss]);
    if (!msg) return null;
    const ok = type === "success";
    return (
        <div style={{ padding:"10px 14px", borderRadius:8, fontSize:13, marginBottom:16,
                      display:"flex", justifyContent:"space-between", alignItems:"center",
                      background:ok?T.greenBg:T.redBg, color:ok?T.green:T.red,
                      border:`1px solid ${ok?"#bbf7d0":"#fecaca"}` }}>
            <span>{msg}</span>
            <button onClick={onDismiss}
                    style={{ background:"none", border:"none", cursor:"pointer", fontSize:16, color:"inherit", lineHeight:1 }}>×</button>
        </div>
    );
};

// ════════════════════════════════════════════════════════════════
// SCREEN 5.1 — LOCATION MANAGEMENT
// ════════════════════════════════════════════════════════════════
const EMPTY_LOC = {
    location_name: "", building_name: "", room_number: "",
    capacity: "", available_from: "08:00", available_to: "18:00",
};

const Screen51 = () => {
    const [locations, setLocations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [form, setForm] = useState(EMPTY_LOC);
    const [editId, setEditId] = useState(null);
    const [flash, setFlash] = useState({ msg: "", type: "" });
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("ACTIVE");

    const showFlash = useCallback((msg, type = "success") => setFlash({ msg, type }), []);
    const hideFlash = useCallback(() => setFlash({ msg: "", type: "" }), []);

    const fetchLocations = useCallback(async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${BASE}/locations`);
            setLocations(Array.isArray(res.data) ? res.data : []);
        } catch {
            showFlash("Failed to load locations.", "error");
        } finally {
            setLoading(false);
        }
    }, [showFlash]);

    useEffect(() => { fetchLocations(); }, [fetchLocations]);

    const handleChange = (e) => setForm(p => ({ ...p, [e.target.name]: e.target.value }));
    const resetForm = () => { setForm(EMPTY_LOC); setEditId(null); };

    const handleEdit = (loc) => {
        setEditId(loc.location_id);
        setForm({
            location_name: loc.location_name || "",
            building_name: loc.building_name || "",
            room_number: loc.room_number || "",
            capacity: loc.capacity != null ? String(loc.capacity) : "",
            available_from: fmtTime(loc.available_from) !== "—" ? fmtTime(loc.available_from) : "08:00",
            available_to: fmtTime(loc.available_to) !== "—" ? fmtTime(loc.available_to) : "18:00",
        });
        window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
    };

    const validate = () => {
        if (!form.location_name.trim()) return "Location name is required.";
        if (!form.building_name.trim()) return "Building name is required.";
        if (!form.room_number.trim()) return "Room number is required.";
        if (form.capacity && Number(form.capacity) < 0) return "Capacity must be positive.";
        if (form.available_from && form.available_to &&
            toMins(form.available_from) >= toMins(form.available_to))
            return "Available-from must be earlier than available-to.";
        return null;
    };

    const handleSave = async () => {
        const err = validate();
        if (err) { showFlash(err, "error"); return; }
        const payload = { ...form, capacity: form.capacity ? Number(form.capacity) : null };
        try {
            if (editId) {
                await axios.put(`${BASE}/locations/${editId}`, payload);
                showFlash("Location updated successfully.");
            } else {
                await axios.post(`${BASE}/locations`, payload);
                showFlash("Location created successfully.");
            }
            resetForm();
            fetchLocations();
        } catch (err) {
            showFlash(err.response?.data?.message || "Failed to save location.", "error");
        }
    };

    const handleDelete = async (loc) => {
        if (!(await appConfirm(`Delete "${loc.location_name}"?`, { title: "Deactivate location", confirmLabel: "Delete", variant: "warning" }))) return;
        try {
            await axios.delete(`${BASE}/locations/${loc.location_id}`);
            showFlash("Location deactivated.");
            fetchLocations();
        } catch (err) {
            showFlash(err.response?.data?.message || "Failed to delete location.", "error");
        }
    };

    //handlehardDelete
    const handleHardDelete = async (loc) => {
    if (!(await appConfirm(
        `Permanently delete "${loc.location_name}"?\n\nThis will also remove all linked schedules, slots, and logs. This cannot be undone.`,
        { title: "Permanent delete", confirmLabel: "Delete forever", variant: "error" }
    ))) return;
    try {
        await axios.delete(`${BASE}/locations/${loc.location_id}/hard`);
        showFlash("Location permanently deleted.");
        fetchLocations();
    } catch (err) {
        showFlash(err.response?.data?.message || "Failed to permanently delete location.", "error");
    }
};

    const filtered = locations.filter(l =>
        ([l.location_name, l.building_name, l.room_number].join(" ").toLowerCase().includes(search.toLowerCase())) &&
        (statusFilter === "ALL" || l.status === statusFilter)
    );

    return (
        <>
            <ScreenLabel num="5.1" label="Location Management UI" />
            <PageHeader
                title="Manage Evaluation Locations"
                sub="Configure rooms and venues available for evaluation scheduling."
            />
            <Flash msg={flash.msg} type={flash.type} onDismiss={hideFlash} />

            <Card>
                <FilterBar>
                    <SearchWrap
                        placeholder="Search locations…"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                    <FG label="Status">
                        <Select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                            <option value="ALL">All</option>
                            <option value="ACTIVE">Active</option>
                            <option value="INACTIVE">Inactive</option>
                        </Select>
                    </FG>
                </FilterBar>

                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                        <tr>
                            <Th>Location Name</Th><Th>Building</Th><Th>Room No.</Th>
                            <Th>Capacity</Th><Th>Available From</Th><Th>Available To</Th>
                            <Th>Status</Th><Th>Action</Th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={8} style={{ textAlign: "center", padding: 24, color: T.text2 }}>Loading…</td></tr>
                        ) : filtered.length === 0 ? (
                            <tr><td colSpan={8} style={{ textAlign: "center", padding: 24, color: T.text3 }}>No locations found.</td></tr>
                        ) : filtered.map(l => (
                            <tr key={l.location_id} style={{ borderBottom: `1px solid ${T.border}`, background: editId === l.location_id ? "#fffbeb" : "" }}>
                                <TdMain main={l.location_name} />
                                <Td mono>{l.building_name}</Td>
                                <Td mono>{l.room_number}</Td>
                                <Td mono>{l.capacity ?? "—"}</Td>
                                <Td mono>{fmtTime(l.available_from)}</Td>
                                <Td mono>{fmtTime(l.available_to)}</Td>
                                <Td><Badge color={l.status === "ACTIVE" ? "green" : "yellow"}>{l.status}</Badge></Td>
                              <Td>
    <div style={{ display: "flex", gap: 6 }}>
        <Btn variant="outline" size="xs" onClick={() => handleEdit(l)}>Edit</Btn>
        {l.status === "ACTIVE" && (
            <Btn variant="danger" size="xs" onClick={() => handleDelete(l)}>Deactivate</Btn>
        )}
        {l.status === "INACTIVE" && (
            <Btn variant="danger" size="xs" onClick={() => handleHardDelete(l)}>Remove</Btn>
        )}
    </div>
</Td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </Card>

            <Card>
                <CardHeader title={editId ? "✏️ Edit Location" : "➕ Add Location"}
                            sub={editId ? `Editing location ID #${editId}` : "Register a new evaluation venue"} />
                <CardBody>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 18 }}>
                        <FG label="Location Name" required>
                            <Input name="location_name" value={form.location_name} onChange={handleChange} placeholder="e.g. Block A – Lab 301" />
                        </FG>
                        <FG label="Building Name" required>
                            <Input name="building_name" value={form.building_name} onChange={handleChange} placeholder="e.g. Block A" />
                        </FG>
                        <FG label="Room Number" required>
                            <Input name="room_number" value={form.room_number} onChange={handleChange} placeholder="e.g. A-301" />
                        </FG>
                        <FG label="Capacity">
                            <Input type="number" min="0" name="capacity" value={form.capacity} onChange={handleChange} placeholder="e.g. 40" />
                        </FG>
                        <FG label="Available From">
                            <Input type="time" name="available_from" value={form.available_from} onChange={handleChange} />
                        </FG>
                        <FG label="Available To">
                            <Input type="time" name="available_to" value={form.available_to} onChange={handleChange} />
                        </FG>
                    </div>
                    <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 18 }}>
                        <Btn variant="ghost" onClick={resetForm}>Cancel</Btn>
                        <Btn onClick={handleSave}>{editId ? "Update Location" : "Save Location"}</Btn>
                    </div>
                </CardBody>
            </Card>
        </>
    );
};

// ════════════════════════════════════════════════════════════════
// SCREEN 5.2 — CREATE EVALUATION SCHEDULE
// ════════════════════════════════════════════════════════════════
const EMPTY_SCHED = {
    academic_year: "2025 / 2026",
    semester: "Semester 1",
    assessment_id: "",
    schedule_title: "",
    evaluation_date: "",
    start_time: "09:00",
    end_time: "17:00",
    location_id: "",
    duration_per_group: 20,
    buffer_minutes: 5,
    total_groups: 12,
};

const Screen52 = ({ navigate, setActiveScheduleId }) => {
    const [locations, setLocations] = useState([]);
    const [assessments, setAssessments] = useState([]);
    const [schedule, setSchedule] = useState(EMPTY_SCHED);
    const [flash, setFlash] = useState({ msg: "", type: "" });
    const [submitting, setSubmitting] = useState(false);

    const showFlash = (msg, type = "success") => setFlash({ msg, type });
    const hideFlash = () => setFlash({ msg: "", type: "" });

    useEffect(() => {
        axios.get(`${BASE}/locations`)
            .then(r => setLocations(Array.isArray(r.data) ? r.data.filter(l => l.status === "ACTIVE") : []))
            .catch(() => showFlash("Could not load locations.", "error"));
    }, []);

    useEffect(() => {
        axios.get(`${BASE}/assessments`)
            .then(r => setAssessments(Array.isArray(r.data) ? r.data : []))
            .catch(() => showFlash("Could not load assessments.", "error"));
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setSchedule(p => ({ ...p, [name]: value }));
    };

    const slotFit = (() => {
        if (!schedule.start_time || !schedule.end_time) return null;
        const windowMins = toMins(schedule.end_time) - toMins(schedule.start_time);
        const slotSize = Number(schedule.duration_per_group) + Number(schedule.buffer_minutes);
        if (slotSize <= 0) return null;
        const max = Math.floor((windowMins + Number(schedule.buffer_minutes)) / slotSize);
        return { max, ok: Number(schedule.total_groups) <= max };
    })();

    const handleGenerate = async () => {
        if (!schedule.location_id)          { showFlash("Please select a location.", "error");         return; }
        if (!schedule.evaluation_date)      { showFlash("Please select an evaluation date.", "error"); return; }
        if (!schedule.schedule_title.trim()){ showFlash("Please enter a schedule title.", "error");    return; }
        if (!schedule.assessment_id)        { showFlash("Please select an assessment.", "error");      return; }
        if (slotFit && !slotFit.ok)         { showFlash(`Only ${slotFit.max} groups fit in the time window.`, "error"); return; }

        setSubmitting(true);
        try {
            const res = await axios.post(`${BASE}/schedules`, {
                assessment_id:               Number(schedule.assessment_id),
                location_id:                 Number(schedule.location_id),
                schedule_title:              schedule.schedule_title,
                date:                        schedule.evaluation_date,
                start_time:                  schedule.start_time,
                end_time:                    schedule.end_time,
                duration_per_group_minutes:  Number(schedule.duration_per_group),
                buffer_minutes:              Number(schedule.buffer_minutes),
                total_groups:                Number(schedule.total_groups),
                created_by:                  USER_ID,
            });
            const newId = res.data.scheduleId;
            if (setActiveScheduleId && newId) {
                setActiveScheduleId(Number(newId));
            }
            showFlash(`✅ Schedule created! ID: ${newId}`);
            setSchedule(EMPTY_SCHED);
            setTimeout(() => navigate("5.4"), 1200);
        } catch (err) {
            if (err.response?.status === 409) {
                showFlash("❌ Location conflict detected for the selected date and time.", "error");
            } else {
                showFlash(err.response?.data?.message || "Error creating schedule.", "error");
            }
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <>
            <ScreenLabel num="5.2" label="Create Evaluation Schedule UI" style={{ marginTop: 32 }} />
            <PageHeader
                title="Create Evaluation Schedule"
                sub="Define time slots, location, and group settings for assignment evaluations."
                right={
                    <>
                        <Btn variant="ghost" onClick={() => setSchedule(EMPTY_SCHED)}>Cancel</Btn>
                        <Btn variant="outline" onClick={() => showFlash("Draft saved (UI only).")}>Save Draft</Btn>
                        <Btn onClick={handleGenerate} disabled={submitting}>
                            {submitting ? "Generating…" : "Generate Slots →"}
                        </Btn>
                    </>
                }
            />
            <Flash msg={flash.msg} type={flash.type} onDismiss={hideFlash} />

            <Card>
                <CardHeader title="Schedule Details" sub="Basic information about this evaluation session" />
                <CardBody>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
                        <FG label="Academic Year" required>
                            <Select name="academic_year" value={schedule.academic_year} onChange={handleChange}>
                                <option>2025 / 2026</option>
                                <option>2024 / 2025</option>
                            </Select>
                        </FG>

                        <FG label="Semester" required>
                            <Select name="semester" value={schedule.semester} onChange={handleChange}>
                                <option>Semester 1</option>
                                <option>Semester 2</option>
                            </Select>
                        </FG>

                        <FG label="Assessment" required>
                            <Select name="assessment_id" value={schedule.assessment_id} onChange={handleChange}>
                                <option value="">Select an assessment…</option>
                                {assessments.map(a => (
                                    <option key={a.assessment_id} value={a.assessment_id}>
                                        {a.assessment_title}
                                    </option>
                                ))}
                            </Select>
                        </FG>

                        <div style={{ gridColumn: "1/-1" }}>
                            <FG label="Schedule Title" required>
                                <Input
                                    name="schedule_title"
                                    value={schedule.schedule_title}
                                    onChange={handleChange}
                                    placeholder="e.g. Final Project Evaluation – Batch 01"
                                />
                            </FG>
                        </div>
                    </div>
                </CardBody>
            </Card>

            <Card>
                <CardHeader title="Time & Location" sub="Set the date, duration per group, and evaluation venue" />
                <CardBody>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 18 }}>
                        <FG label="Evaluation Date" required>
                            <Input type="date" name="evaluation_date" value={schedule.evaluation_date} onChange={handleChange} />
                        </FG>

                        <FG label="Start Time" required>
                            <Input type="time" name="start_time" value={schedule.start_time} onChange={handleChange} />
                        </FG>

                        <FG label="End Time" required>
                            <Input type="time" name="end_time" value={schedule.end_time} onChange={handleChange} />
                        </FG>

                        <FG label="Location / Room" required>
                            <Select name="location_id" value={schedule.location_id} onChange={handleChange}>
                                <option value="">Select a location…</option>
                                {locations.map(l => (
                                    <option key={l.location_id} value={l.location_id}>
                                        {l.location_name} – {l.room_number}
                                    </option>
                                ))}
                            </Select>
                        </FG>
                    </div>

                    <Divider />

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 18 }}>
                        <FG label="Duration per Group (min)" required>
                            <Input type="number" min="1" name="duration_per_group" value={schedule.duration_per_group} onChange={handleChange} />
                        </FG>

                        <FG label="Buffer Between Slots (min)">
                            <Input type="number" min="0" name="buffer_minutes" value={schedule.buffer_minutes} onChange={handleChange} />
                        </FG>

                        <FG label="Total Groups" required>
                            <Input type="number" min="1" name="total_groups" value={schedule.total_groups} onChange={handleChange} />
                        </FG>
                    </div>

                    {slotFit && (
                        <div style={{
                            marginTop: 14, padding: "10px 14px", borderRadius: 8, fontSize: 13, fontWeight: 500,
                            background: slotFit.ok ? T.greenBg : T.redBg,
                            color: slotFit.ok ? T.green : T.red,
                            border: `1px solid ${slotFit.ok ? "#86efac" : "#fca5a5"}`,
                        }}>
                            {slotFit.ok
                                ? `✓ ${schedule.total_groups} groups fit within the time window (max ${slotFit.max})`
                                : `✗ Only ${slotFit.max} groups fit — reduce total groups or widen the time window`}
                        </div>
                    )}

                    <Divider />
                    <ConflictStatus ok />
                    <ToggleRow
                        label="Auto-Generate Time Slots"
                        desc="System will automatically create slots with buffer from start time"
                    />
                </CardBody>
            </Card>
        </>
    );
};

// ════════════════════════════════════════════════════════════════
// SCREEN 5.3 — SCHEDULE LIST
// ════════════════════════════════════════════════════════════════
const Screen53 = ({ setActiveScheduleId, navigate }) => {
    const [schedules,  setSchedules]  = useState([]);
    const [loading,    setLoading]    = useState(true);
    const [flash,      setFlash]      = useState({ msg:"", type:"" });
    const [search,     setSearch]     = useState("");
    const [publishing, setPublishing] = useState(null);
    const [cancelling, setCancelling] = useState(null);

    const showFlash = (msg, type = "success") => setFlash({ msg, type });
    const hideFlash = () => setFlash({ msg:"", type:"" });

    const fetchSchedules = useCallback(async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${BASE}/schedules`);
            setSchedules(Array.isArray(res.data) ? res.data : []);
        } catch {
            showFlash("Failed to load schedules.", "error");
            setSchedules([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchSchedules(); }, [fetchSchedules]);

    const handlePublish = async (sched) => {
        setPublishing(sched.evaluation_schedule_id);
        try {
            await axios.patch(`${BASE}/schedules/${sched.evaluation_schedule_id}/publish`, { published_by: USER_ID });
            showFlash("Schedule published successfully.");
            fetchSchedules();
        } catch (err) {
            showFlash(err.response?.data?.message || "Publish failed.", "error");
        } finally { setPublishing(null); }
    };

    const handleCancel = async (sched) => {
        if (!(await appConfirm(`Cancel schedule "${sched.schedule_title || `#${sched.evaluation_schedule_id}`}"?`, { title: "Cancel schedule", confirmLabel: "Cancel schedule", variant: "warning" }))) return;
        setCancelling(sched.evaluation_schedule_id);
        try {
            await axios.patch(`${BASE}/schedules/${sched.evaluation_schedule_id}/cancel`, {});
            showFlash("Schedule cancelled.");
            fetchSchedules();
        } catch (err) {
            showFlash(err.response?.data?.message || "Cancel failed.", "error");
        } finally { setCancelling(null); }
    };

    const handleViewSlots = (sched) => {
        if (setActiveScheduleId) setActiveScheduleId(Number(sched.evaluation_schedule_id));
        navigate("5.4");
    };

    const statusColor = (s) => ({ DRAFT:"yellow", PUBLISHED:"green", CANCELLED:"gray" }[s] || "gray");

    const filtered = schedules.filter(s =>
        [s.schedule_title, s.assessment_name, s.location_name]
            .join(" ").toLowerCase().includes(search.toLowerCase())
    );

    return (
        <>
            <ScreenLabel num="5.3" label="Schedule List UI" style={{ marginTop:32 }}/>
            <PageHeader title="Evaluation Schedules"
                        sub="View and manage all created evaluation schedules."
                        right={<Btn onClick={fetchSchedules} variant="outline">↻ Refresh</Btn>}/>
            <Flash msg={flash.msg} type={flash.type} onDismiss={hideFlash}/>
            <Card>
                <FilterBar>
                    <SearchWrap placeholder="Search schedules…" value={search}
                                onChange={e => setSearch(e.target.value)}/>
                    <FilterBtn>📅 Status</FilterBtn>
                    <FilterBtn>📚 Assessment</FilterBtn>
                </FilterBar>
                <table style={{ width:"100%", borderCollapse:"collapse" }}>
                    <thead><tr>
                        <Th>Schedule Title</Th><Th>Assessment</Th><Th>Date</Th>
                        <Th>Time Window</Th><Th>Groups</Th><Th>Assigned</Th><Th>Status</Th><Th>Actions</Th>
                    </tr></thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={8} style={{ textAlign:"center", padding:24, color:T.text2 }}>Loading…</td></tr>
                        ) : filtered.length === 0 ? (
                            <tr><td colSpan={8} style={{ textAlign:"center", padding:24, color:T.text3 }}>No schedules found.</td></tr>
                        ) : filtered.map(s => (
                            <tr key={s.evaluation_schedule_id} style={{ borderBottom:`1px solid ${T.border}` }}>
                                <TdMain main={s.schedule_title || `Schedule #${s.evaluation_schedule_id}`}
                                        sub={`ID: ${s.evaluation_schedule_id} · v${s.draft_version_no}`}/>
                                <TdMain main={s.assessment_name || "—"} sub={`${s.location_name || "—"} ${s.room_number ? `· ${s.room_number}` : ""}`}/>
                                <Td mono>
                                    {s.date ? new Date(s.date).toLocaleDateString("en-GB",{day:"2-digit",month:"short",year:"numeric"}) : "—"}
                                </Td>
                                <Td mono>{fmtTime(s.start_time)} – {fmtTime(s.end_time)}</Td>
                                <Td mono style={{ textAlign:"center" }}>{s.total_groups}</Td>
                                <Td>
                                    <div style={{ fontSize:12, color:T.text2 }}>{s.assigned_count ?? 0} / {s.total_groups}</div>
                                    <div style={{ height:5, borderRadius:3, background:T.border, overflow:"hidden", marginTop:4 }}>
                                        <div style={{ height:"100%", borderRadius:3, background:T.blue,
                                                      width:`${Math.min(100,Math.round(((s.assigned_count||0)/s.total_groups)*100))}%` }}/>
                                    </div>
                                </Td>
                                <Td><Badge color={statusColor(s.status)}>{s.status}</Badge></Td>
                                <Td>
                                    <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                                        <Btn variant="ghost" size="xs" onClick={() => handleViewSlots(s)}>View Slots</Btn>
                                        {s.status === "DRAFT" && (
                                            <Btn variant="outline" size="xs"
                                                 disabled={publishing === s.evaluation_schedule_id}
                                                 onClick={() => handlePublish(s)}>
                                                {publishing === s.evaluation_schedule_id ? "…" : "Publish"}
                                            </Btn>
                                        )}
                                        {s.status !== "CANCELLED" && (
                                            <Btn variant="danger" size="xs"
                                                 disabled={cancelling === s.evaluation_schedule_id}
                                                 onClick={() => handleCancel(s)}>
                                                {cancelling === s.evaluation_schedule_id ? "…" : "Cancel"}
                                            </Btn>
                                        )}
                                    </div>
                                </Td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {!loading && (
                    <div style={{ padding:"10px 22px", borderTop:`1px solid ${T.border}`,
                                  display:"flex", gap:20, fontSize:12.5, color:T.text2 }}>
                        <span>Total: <strong style={{ color:T.text }}>{schedules.length}</strong></span>
                        <span>Draft: <strong style={{ color:T.yellow }}>{schedules.filter(s=>s.status==="DRAFT").length}</strong></span>
                        <span>Published: <strong style={{ color:T.green }}>{schedules.filter(s=>s.status==="PUBLISHED").length}</strong></span>
                        <span>Cancelled: <strong style={{ color:T.text3 }}>{schedules.filter(s=>s.status==="CANCELLED").length}</strong></span>
                    </div>
                )}
            </Card>
        </>
    );
};

// ════════════════════════════════════════════════════════════════
// SCREEN 5.4 — SLOT PREVIEW
// ════════════════════════════════════════════════════════════════
const SlotItem = ({ time, group, status, last }) => {
    const assigned = status === "ASSIGNED";
    return (
        <div style={{ display:"flex", alignItems:"center", gap:0 }}>
            <div style={{ display:"flex", flexDirection:"column", alignItems:"center", width:32, flexShrink:0 }}>
                <div style={{ width:12, height:12, borderRadius:"50%",
                              border:`2px solid ${assigned?T.blue:T.border2}`,
                              background:assigned?T.blue:"white", flexShrink:0 }}/>
                {!last && <div style={{ width:2, flex:1, minHeight:8, background:T.border }}/>}
            </div>
            <div style={{ flex:1, margin:"3px 0", marginLeft:12, border:`1px solid ${T.border}`,
                          borderLeft:`3px solid ${assigned?T.blue:T.border2}`, borderRadius:8,
                          padding:"10px 14px", display:"flex", alignItems:"center", gap:12,
                          background:assigned?"white":"#fafafa" }}>
                <span style={{ fontFamily:mono, fontSize:12, color:T.blue, fontWeight:500, minWidth:130 }}>{time}</span>
                <span style={{ fontSize:13, fontWeight:600, flex:1, color:assigned?T.text:T.text2 }}>{group}</span>
                <Badge color={assigned?"green":"gray"}>{assigned?"Assigned":"Open"}</Badge>
            </div>
        </div>
    );
};
const BufferPill = ({ label }) => (
    <div style={{ display:"flex", alignItems:"center", gap:8, padding:"4px 12px 4px 44px",
                  fontSize:11.5, color:T.yellow, fontWeight:500, fontFamily:mono }}>
        ⏱ {label}
    </div>
);

const Screen54 = ({ navigate, activeScheduleId }) => {
    const [slots,   setSlots]   = useState([]);
    const [loading, setLoading] = useState(false);
    const [error,   setError]   = useState("");

    useEffect(() => {
        if (!activeScheduleId) return;
        setLoading(true);
        setError("");
        axios.get(`${BASE}/schedules/${activeScheduleId}/slots`)
            .then(r  => setSlots(Array.isArray(r.data) ? r.data : []))
            .catch(() => setError("Failed to load slots."))
            .finally(() => setLoading(false));
    }, [activeScheduleId]);

    const assigned  = slots.filter(s => s.slot_status === "ASSIGNED").length;
    const open      = slots.filter(s => s.slot_status !== "ASSIGNED").length;
    const totalMins = slots.reduce((acc, s) => {
        if (!s.slot_start_time || !s.slot_end_time) return acc;
        const st = fmtTime(s.slot_start_time);
        const et = fmtTime(s.slot_end_time);
        if (st === "—" || et === "—") return acc;
        return acc + (toMins(et) - toMins(st));
    }, 0);
    const totalHrs  = Math.floor(totalMins / 60);
    const totalMin2 = totalMins % 60;

    return (
        <>
            <ScreenLabel num="5.4" label="Auto Slot Preview UI" style={{ marginTop:32 }}/>
            {!activeScheduleId && (
                <div style={{ padding:"16px 20px", background:T.yellowBg, borderRadius:8, color:T.yellow,
                              fontSize:13, marginBottom:16, border:`1px solid #fde68a` }}>
                    ⚠️ No schedule selected. Create a schedule first or click "View Slots" from the Schedule List.
                </div>
            )}
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:24, marginBottom:24 }}>
                <Card style={{ marginBottom:0 }}>
                    <CardHeader title="Generated Time Slots"
                                sub={activeScheduleId ? `Schedule ID #${activeScheduleId}` : "No schedule selected"}
                                right={<Badge color="blue">{slots.length} Slots</Badge>}/>
                    <CardBody style={{ paddingTop:16 }}>
                        {loading ? (
                            <div style={{ textAlign:"center", padding:24, color:T.text2 }}>Loading slots…</div>
                        ) : error ? (
                            <div style={{ color:T.red, fontSize:13 }}>{error}</div>
                        ) : slots.length === 0 ? (
                            <div style={{ textAlign:"center", padding:24, color:T.text3, fontSize:13 }}>No slots found.</div>
                        ) : (
                            <div style={{ display:"flex", flexDirection:"column", gap:0 }}>
                                {slots.map((s, i) => {
                                    const timeStr  = `${fmtTime(s.slot_start_time)} – ${fmtTime(s.slot_end_time)}`;
                                    const groupLbl = s.group_id ? `Group ID: ${s.group_id}` : "— Unassigned —";
                                    const bufMins  = s.buffer_minutes || 0;
                                    return (
                                        <React.Fragment key={s.evaluation_slot_id}>
                                            <SlotItem time={timeStr} group={groupLbl} status={s.slot_status}
                                                      last={i === slots.length - 1}/>
                                            {bufMins > 0 && i < slots.length - 1 && (
                                                <BufferPill label={`${bufMins} min buffer`}/>
                                            )}
                                        </React.Fragment>
                                    );
                                })}
                            </div>
                        )}
                        <div style={{ display:"flex", alignItems:"center", gap:10, paddingTop:20,
                                      borderTop:`1px solid ${T.border}`, flexWrap:"wrap", marginTop:12 }}>
                            <Btn variant="ghost" onClick={() => navigate("5.2")}>← Back to Edit</Btn>
                            <div style={{ marginLeft:"auto", display:"flex", gap:8 }}>
                                <Btn variant="outline" onClick={() => navigate("5.5")}>Assign Groups</Btn>
                                <Btn onClick={() => navigate("5.6")}>Publish Schedule</Btn>
                            </div>
                        </div>
                    </CardBody>
                </Card>
                <Card style={{ marginBottom:0 }}>
                    <CardHeader title="Slot Summary" sub="Overview of generated slots"/>
                    <CardBody>
                        {[
                            ["Total Slots Generated", slots.length],
                            ["Assigned Slots",         <span style={{ color:T.green }}>{assigned}</span>],
                            ["Open Slots",             <span style={{ color:T.blue }}>{open}</span>],
                            ["Total Time Required",    totalMins > 0 ? `${totalHrs}h ${totalMin2}m` : "—"],
                            ["Schedule ID",            activeScheduleId ? <span style={{ fontFamily:mono }}># {activeScheduleId}</span> : "—"],
                        ].map(([k, v], i, arr) => (
                            <div key={i} style={{ display:"flex", alignItems:"center", gap:12, padding:"11px 0",
                                                 fontSize:13.5, borderBottom:i<arr.length-1?`1px solid ${T.border}`:"none" }}>
                                <span style={{ color:T.text2, minWidth:180, flexShrink:0, fontSize:12.5 }}>{k}</span>
                                <span style={{ color:T.text, fontWeight:500 }}>{v}</span>
                            </div>
                        ))}
                        <div style={{ display:"flex", gap:8, marginTop:20, paddingTop:16, borderTop:`1px solid ${T.border}` }}>
                            <Btn variant="outline" size="sm" style={{ flex:1 }} onClick={() => navigate("5.5")}>→ Go to Group Assignment</Btn>
                            <Btn variant="ghost"   size="sm" style={{ flex:1 }} onClick={() => navigate("5.3")}>View Schedule List</Btn>
                        </div>
                    </CardBody>
                </Card>
            </div>
        </>
    );
};

// ════════════════════════════════════════════════════════════════
// SCREEN 5.5 — GROUP ASSIGNMENT
// ════════════════════════════════════════════════════════════════
const GROUP_OPTIONS = [
    { id:1,  label:"SE-G01" }, { id:2,  label:"SE-G02" }, { id:3,  label:"SE-G03" },
    { id:4,  label:"SE-G04" }, { id:5,  label:"SE-G05" }, { id:6,  label:"SE-G06" },
    { id:7,  label:"SE-G07" }, { id:8,  label:"SE-G08" }, { id:9,  label:"DS-G01" },
    { id:10, label:"AI-G01" },
];

const Screen55 = ({ navigate, activeScheduleId }) => {
    const [slots,        setSlots]        = useState([]);
    const [loading,      setLoading]      = useState(false);
    const [flash,        setFlash]        = useState({ msg:"", type:"" });
    const [remarks,      setRemarks]      = useState("");
    const [assigning,    setAssigning]    = useState(null);
    const [groupSelects, setGroupSelects] = useState({});

    const showFlash = (msg, type = "success") => setFlash({ msg, type });
    const hideFlash = () => setFlash({ msg:"", type:"" });

    const fetchSlots = useCallback(async () => {
        if (!activeScheduleId) return;
        setLoading(true);
        try {
            const res = await axios.get(`${BASE}/schedules/${activeScheduleId}/slots`);
            setSlots(Array.isArray(res.data) ? res.data : []);
        } catch {
            showFlash("Failed to load slots.", "error");
        } finally {
            setLoading(false);
        }
    }, [activeScheduleId]);

    useEffect(() => { fetchSlots(); }, [fetchSlots]);

    const handleGroupChange = (slotId, value) =>
        setGroupSelects(p => ({ ...p, [slotId]: value }));

    const handleAssign = async (slot) => {
        const groupId = groupSelects[slot.evaluation_slot_id];
        if (!groupId) { showFlash("Please select a group first.", "error"); return; }
        setAssigning(slot.evaluation_slot_id);
        try {
            await axios.post(`${BASE}/slots/${slot.evaluation_slot_id}/assign`, {
                group_id:    Number(groupId),
                assigned_by: USER_ID,
                remarks:     remarks.trim() || null,
            });
            showFlash(`Group assigned to slot #${slot.slot_sequence_no}.`);
            setGroupSelects(p => { const n = {...p}; delete n[slot.evaluation_slot_id]; return n; });
            fetchSlots();
        } catch (err) {
            showFlash(err.response?.data?.message || "Assignment failed.", "error");
        } finally {
            setAssigning(null);
        }
    };

    const unassigned = slots.filter(s => s.slot_status !== "ASSIGNED").length;
    const assigned   = slots.filter(s => s.slot_status === "ASSIGNED").length;

    const assignedGroupIds = new Set(slots.filter(s => s.group_id).map(s => Number(s.group_id)));

    return (
        <>
            <ScreenLabel num="5.5" label="Group Assignment UI"/>
            <Flash msg={flash.msg} type={flash.type} onDismiss={hideFlash}/>
            {!activeScheduleId && (
                <div style={{ padding:"12px 16px", background:T.yellowBg, borderRadius:8,
                              color:T.yellow, fontSize:13, marginBottom:16, border:`1px solid #fde68a` }}>
                    ⚠️ No active schedule. Navigate from the slot preview or schedule list.
                </div>
            )}
            <Card>
                <CardHeader title="Group Assignment"
                            sub={activeScheduleId ? `Schedule ID #${activeScheduleId}` : "No schedule selected"}
                            right={<Btn variant="outline" size="sm" onClick={fetchSlots}>↻ Refresh</Btn>}/>
                <div style={{ padding:"12px 22px", borderBottom:`1px solid ${T.border}`, display:"flex", gap:16, fontSize:12.5 }}>
                    <span style={{ color:T.text2 }}>Unassigned: <strong style={{ color:T.red }}>{unassigned}</strong></span>
                    <span style={{ color:T.text2 }}>Assigned: <strong style={{ color:T.green }}>{assigned}</strong></span>
                </div>
                <table style={{ width:"100%", borderCollapse:"collapse" }}>
                    <thead><tr>
                        <Th>Slot #</Th><Th>Slot Time</Th><Th>Assign Group</Th>
                        <Th>Attendance</Th><Th>Eval Done</Th><Th>Status</Th><Th>Action</Th>
                    </tr></thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={7} style={{ textAlign:"center", padding:24, color:T.text2 }}>Loading…</td></tr>
                        ) : slots.length === 0 ? (
                            <tr><td colSpan={7} style={{ textAlign:"center", padding:24, color:T.text3 }}>No slots found.</td></tr>
                        ) : slots.map(s => {
                            const isAssigned = s.slot_status === "ASSIGNED";
                            const timeStr    = `${fmtTime(s.slot_start_time)} – ${fmtTime(s.slot_end_time)}`;
                            const availableGroups = GROUP_OPTIONS.filter(g =>
                                !assignedGroupIds.has(g.id) || Number(s.group_id) === g.id
                            );
                            return (
                                <tr key={s.evaluation_slot_id} style={{ borderBottom:`1px solid ${T.border}` }}>
                                    <Td mono style={{ color:T.text2 }}>#{s.slot_sequence_no}</Td>
                                    <Td mono style={{ color:isAssigned?T.blue:T.text2 }}>{timeStr}</Td>
                                    <Td>
                                        {isAssigned ? (
                                            <span style={{ fontSize:12.5, color:T.green, fontWeight:600 }}>
                                                {GROUP_OPTIONS.find(g => g.id === Number(s.group_id))?.label || `Group ID: ${s.group_id}`}
                                            </span>
                                        ) : (
                                            <select value={groupSelects[s.evaluation_slot_id] || ""}
                                                    onChange={e => handleGroupChange(s.evaluation_slot_id, e.target.value)}
                                                    style={{ padding:"5px 8px", fontSize:12.5,
                                                             border:`1.5px solid #fca5a5`, borderRadius:6, fontFamily:font }}>
                                                <option value="">Select group…</option>
                                                {availableGroups.map(g => (
                                                    <option key={g.id} value={g.id}>{g.label}</option>
                                                ))}
                                            </select>
                                        )}
                                    </Td>
                                    <Td>
                                        <Badge color={s.attendance_status==="PRESENT"?"green":s.attendance_status==="ABSENT"?"red":"gray"}>
                                            {s.attendance_status || "—"}
                                        </Badge>
                                    </Td>
                                    <Td>
                                        <Badge color={s.evaluation_completed?"green":"gray"}>
                                            {s.evaluation_completed?"✓ Done":"—"}
                                        </Badge>
                                    </Td>
                                    <Td><Badge color={isAssigned?"green":"yellow"}>{s.slot_status}</Badge></Td>
                                    <Td>
                                        {!isAssigned && (
                                            <Btn variant="outline" size="xs"
                                                 disabled={assigning === s.evaluation_slot_id}
                                                 onClick={() => handleAssign(s)}>
                                                {assigning === s.evaluation_slot_id ? "…" : "Assign"}
                                            </Btn>
                                        )}
                                    </Td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
                <div style={{ padding:"14px 22px", borderTop:`1px solid ${T.border}` }}>
                    <FG label="Remarks / Notes (applied to next assignment)">
                        <Input value={remarks} onChange={e => setRemarks(e.target.value)}
                               placeholder="e.g. Group 3 requested slot swap…"/>
                    </FG>
                    <div style={{ display:"flex", gap:8, justifyContent:"flex-end", marginTop:14 }}>
                        <Btn variant="ghost" onClick={() => navigate("5.4")}>← Back to Slots</Btn>
                        <Btn onClick={() => navigate("5.6")}>Review &amp; Publish →</Btn>
                    </div>
                </div>
            </Card>
        </>
    );
};

// ════════════════════════════════════════════════════════════════
// SCREEN 5.6 — CONFLICT DETECTION & PUBLICATION STATUS
// ════════════════════════════════════════════════════════════════
const Screen56 = ({ navigate, activeScheduleId }) => {
    const [conflicts,  setConflicts]  = useState([]);
    const [schedule,   setSchedule]   = useState(null);
    const [loading,    setLoading]    = useState(false);
    const [flash,      setFlash]      = useState({ msg:"", type:"" });
    const [publishing, setPublishing] = useState(false);

    const showFlash = (msg, type = "success") => setFlash({ msg, type });
    const hideFlash = () => setFlash({ msg:"", type:"" });

    const fetchData = useCallback(async () => {
        if (!activeScheduleId) return;
        setLoading(true);
        try {
            const [confRes, schedRes] = await Promise.all([
                axios.get(`${BASE}/schedules/${activeScheduleId}/conflicts`),
                axios.get(`${BASE}/schedules`),
            ]);
            setConflicts(Array.isArray(confRes.data) ? confRes.data : []);
            const all = Array.isArray(schedRes.data) ? schedRes.data : [];
            setSchedule(all.find(s => Number(s.evaluation_schedule_id) === Number(activeScheduleId)) || null);
        } catch {
            showFlash("Failed to load data.", "error");
        } finally {
            setLoading(false);
        }
    }, [activeScheduleId]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const unresolved        = conflicts.filter(c => !c.resolved);
    const resolved          = conflicts.filter(c =>  c.resolved);
    const hasConflicts      = unresolved.length > 0;
    const allGroupsAssigned = schedule ? (Number(schedule.assigned_count) >= Number(schedule.total_groups)) : false;
    const canPublish        = !hasConflicts && allGroupsAssigned && schedule?.status === "DRAFT";

    const handlePublish = async () => {
        setPublishing(true);
        try {
            await axios.patch(`${BASE}/schedules/${activeScheduleId}/publish`, { published_by: USER_ID });
            showFlash("Schedule published successfully!");
            fetchData();
        } catch (err) {
            showFlash(err.response?.data?.message || "Publish failed.", "error");
        } finally {
            setPublishing(false);
        }
    };

    return (
        <>
            <ScreenLabel num="5.6" label="Conflict Detection & Publication Status UI"/>
            <Flash msg={flash.msg} type={flash.type} onDismiss={hideFlash}/>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:24, marginBottom:24 }}>
                <Card style={{ marginBottom:0 }}>
                    <CardHeader title="Conflict Log"
                                sub={activeScheduleId ? `Schedule ID #${activeScheduleId}` : "No schedule selected"}
                                right={
                                    <div style={{ display:"flex", gap:6 }}>
                                        {unresolved.length > 0 && <Badge color="red">{unresolved.length} Unresolved</Badge>}
                                        {resolved.length   > 0 && <Badge color="green">{resolved.length} Resolved</Badge>}
                                        {conflicts.length === 0 && !loading && <Badge color="green">No Conflicts</Badge>}
                                    </div>
                                }/>
                    <CardBody>
                        {loading ? (
                            <div style={{ color:T.text2, fontSize:13 }}>Loading…</div>
                        ) : conflicts.length === 0 ? (
                            <div style={{ padding:"20px 0", textAlign:"center", color:T.text3, fontSize:13 }}>
                                No conflicts found for this schedule. ✓
                            </div>
                        ) : conflicts.map(c => (
                            <ConflictCard key={c.conflict_id} resolved={!!c.resolved}
                                icon={c.resolved?"✅":"⚠️"} title={c.conflict_type || "Conflict"}
                                desc={c.conflict_description || "No description"}
                                action={!c.resolved
                                    ? <Btn variant="danger" size="sm" onClick={() => navigate("5.5")}>Reassign</Btn>
                                    : <span style={{ fontSize:12, color:T.text2 }}>
                                        {c.resolved_at ? new Date(c.resolved_at).toLocaleString() : "Resolved"}
                                      </span>
                                }/>
                        ))}
                        <div style={{ display:"flex", alignItems:"center", gap:10, paddingTop:20, borderTop:`1px solid ${T.border}` }}>
                            <div style={{ marginLeft:"auto" }}>
                                <Btn variant="outline" onClick={fetchData}>Re-validate</Btn>
                            </div>
                        </div>
                    </CardBody>
                </Card>
                <Card style={{ marginBottom:0 }}>
                    <CardHeader title="Publication Status" sub="Review final status before publishing to students"/>
                    <CardBody>
                        {schedule ? ([
                            ["Schedule Title",     schedule.schedule_title || "—"],
                            ["Date",               schedule.date ? new Date(schedule.date).toLocaleDateString("en-GB") : "—"],
                            ["Total Slots",        schedule.total_groups],
                            ["Assigned Groups",    <span style={{ color:T.blue }}>{schedule.assigned_count ?? 0} / {schedule.total_groups}</span>],
                            ["Draft Version",      <span style={{ fontFamily:mono }}>v{schedule.draft_version_no}</span>],
                            ["Published By",       schedule.published_by || "—"],
                            ["Published At",       schedule.published_at ? new Date(schedule.published_at).toLocaleString() : "—"],
                            ["Status",             <Badge color={schedule.status==="PUBLISHED"?"green":schedule.status==="DRAFT"?"yellow":"gray"}>{schedule.status}</Badge>],
                            ["Email Notifications", <span style={{ fontSize:12.5, color:T.text3, fontWeight:600 }}>Disabled</span>],
                        ].map(([k, v], i, arr) => (
                            <div key={i} style={{ display:"flex", alignItems:"center", gap:12, padding:"11px 0",
                                                 fontSize:13.5, borderBottom:i<arr.length-1?`1px solid ${T.border}`:"none" }}>
                                <span style={{ color:T.text2, minWidth:160, flexShrink:0, fontSize:12.5 }}>{k}</span>
                                <span style={{ color:T.text, fontWeight:500 }}>{v}</span>
                            </div>
                        ))) : (
                            <div style={{ color:T.text3, fontSize:13 }}>{activeScheduleId ? "Loading schedule data…" : "No schedule selected."}</div>
                        )}
                        <Divider/>
                        <ConflictStatus ok={!hasConflicts}/>
                        {(!allGroupsAssigned || hasConflicts) && activeScheduleId && (
                            <Alert type="warning" icon="⚠️">
                                {hasConflicts && "Resolve all conflicts. "}
                                {!allGroupsAssigned && "Assign all groups before publishing."}
                            </Alert>
                        )}
                        <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                            <Btn variant="ghost" onClick={() => navigate("5.2")}>← Back to Edit</Btn>
                            <Btn disabled={!canPublish || publishing} onClick={handlePublish}>
                                {publishing ? "Publishing…" : "Publish Schedule →"}
                            </Btn>
                        </div>
                        {!canPublish && activeScheduleId && (
                            <p style={{ fontSize:11.5, color:T.text3, marginTop:8 }}>
                                Publish unlocks once all conflicts are resolved and all groups are assigned.
                            </p>
                        )}
                    </CardBody>
                </Card>
            </div>
        </>
    );
};

const EMAIL_TYPE_LABELS = {
    SCHEDULE_PUBLISHED: "Schedule Published",
    SLOT_ASSIGNED:      "Slot Assigned",
    REMINDER:           "Reminder",
};

// ════════════════════════════════════════════════════════════════
// SCREEN 5.7 — EMAIL NOTIFICATION LOG
// ════════════════════════════════════════════════════════════════
const Screen57 = ({ navigate: _navigate, activeScheduleId }) => {
    void _navigate;
    const [logs] = useState([]);
    const [summary] = useState({ total:0, sent:0, failed:0, pending:0 });
    const [loading] = useState(false);
    const [sendingReminder] = useState(false);
    const [resending] = useState(null);
    const [flash,         setFlash]         = useState({ msg:"", type:"" });
    const [search,        setSearch]        = useState("");
    const [typeFilter,    setTypeFilter]    = useState("ALL");
    const [statFilter,    setStatFilter]    = useState("ALL");
    const [previewLog,    setPreviewLog]    = useState(null);

    const showFlash = useCallback((msg, type = "success") => setFlash({ msg, type }), []);
    const hideFlash = useCallback(() => setFlash({ msg:"", type:"" }), []);

    const fetchLogs = useCallback(async () => {
        // Compliance: email notification features are disabled (no email log fetching, no sending).
        void activeScheduleId;
    }, [activeScheduleId]);

    useEffect(() => { fetchLogs(); }, [fetchLogs]);

    const handleSendReminders = async () => {
        // Compliance: no reminder emails
        showFlash("Email notification features are disabled in this platform version.", "warning");
    };

    const handleResend = async (log) => {
        // Compliance: no resend emails
        showFlash("Email notification features are disabled in this platform version.", "warning");
        void log;
    };

    const emailTypeColor = (t) => ({ SCHEDULE_PUBLISHED:"green", SLOT_ASSIGNED:"blue", REMINDER:"yellow" }[t] || "gray");
    const statusColor    = (s) => ({ SENT:"green", FAILED:"red", PENDING:"yellow" }[s] || "gray");

    const filtered = logs.filter(l => {
        const matchSearch = [l.recipient_emails, l.group_label, l.email_type]
            .join(" ").toLowerCase().includes(search.toLowerCase());
        const matchType   = typeFilter === "ALL" || l.email_type === typeFilter;
        const matchStatus = statFilter === "ALL" || l.delivery_status === statFilter;
        return matchSearch && matchType && matchStatus;
    });

    // ── Email Preview Modal ──────────────────────────────────────────
    const PreviewModal = ({ log, onClose }) => (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.45)",
                      display:"flex", alignItems:"center", justifyContent:"center", zIndex:999 }}>
            <div style={{ background:"white", borderRadius:12, width:560, maxHeight:"80vh",
                          overflow:"auto", boxShadow:"0 8px 32px rgba(0,0,0,0.18)" }}>
                <div style={{ padding:"16px 20px", borderBottom:`1px solid ${T.border}`,
                              display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                    <div style={{ fontSize:14, fontWeight:700, color:T.text }}>Email Details</div>
                    <button onClick={onClose} style={{ background:"none", border:"none",
                                                       fontSize:20, cursor:"pointer", color:T.text2 }}>×</button>
                </div>
                <div style={{ padding:20 }}>
                    {[
                        ["Type",       <Badge color={emailTypeColor(log.email_type)}>{EMAIL_TYPE_LABELS[log.email_type] || log.email_type}</Badge>],
                        ["Group",      log.group_label || "—"],
                        ["Recipients", log.recipient_count ? `${log.recipient_count} student(s)` : "—"],
                        ["Sent To (BCC)", log.recipient_emails || "—"],
                        ["Sent At",    log.sent_at ? new Date(log.sent_at).toLocaleString("en-GB") : "—"],
                        ["Status",     <Badge color={statusColor(log.delivery_status)}>{log.delivery_status}</Badge>],
                        ["Retries",    log.retry_count ?? 0],
                    ].map(([k, v], i, arr) => (
                        <div key={i} style={{ display:"flex", gap:12, padding:"10px 0",
                                             fontSize:13, borderBottom:i<arr.length-1?`1px solid ${T.border}`:"none",
                                             flexWrap:"wrap" }}>
                            <span style={{ color:T.text2, minWidth:140, flexShrink:0, fontSize:12.5 }}>{k}</span>
                            <span style={{ color:T.text, fontWeight:500, wordBreak:"break-all" }}>{v}</span>
                        </div>
                    ))}
                    <div style={{ display:"flex", gap:8, marginTop:16, justifyContent:"flex-end" }}>
                        <Btn variant="ghost" onClick={onClose}>Close</Btn>
                        <Btn variant="outline" onClick={() => { handleResend(log); onClose(); }}>
                            ↺ Resend
                        </Btn>
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <>
            <ScreenLabel num="5.7" label="Email Notification Log & Control"/>
            <PageHeader
                title="Email Notification Log"
                sub={activeScheduleId
                    ? `Email delivery control for Schedule ID #${activeScheduleId}`
                    : "Publish a schedule first to manage email notifications."}
                right={
                    <div style={{ display:"flex", gap:8 }}>
                        {activeScheduleId && (
                            <Btn
                                variant="outline"
                                disabled={sendingReminder}
                                onClick={handleSendReminders}
                                style={{ borderColor:"#fbbf24", color:"#d97706" }}
                            >
                                {sendingReminder ? "Sending…" : "📨 Send Reminders to All Groups"}
                            </Btn>
                        )}
                        <Btn variant="outline" onClick={fetchLogs}>↻ Refresh</Btn>
                    </div>
                }
                style={{ marginBottom:16 }}/>

            <Flash msg={flash.msg} type={flash.type} onDismiss={hideFlash}/>

            {!activeScheduleId && (
                <div style={{ padding:"12px 16px", background:T.yellowBg, borderRadius:8,
                              color:T.yellow, fontSize:13, marginBottom:16, border:`1px solid #fde68a` }}>
                    ⚠️ No active schedule. View email logs after publishing a schedule.
                </div>
            )}

            {activeScheduleId && !loading && (
                <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:14, marginBottom:20 }}>
                    {[
                        { label:"Total Emails",  value: summary.total,   color: T.text,   bg: T.white   },
                        { label:"Delivered",     value: summary.sent,    color: T.green,  bg: T.greenBg },
                        { label:"Failed",        value: summary.failed,  color: T.red,    bg: T.redBg   },
                        { label:"Pending",       value: summary.pending, color: T.yellow, bg: T.yellowBg },
                    ].map(({ label, value, color, bg }) => (
                        <div key={label} style={{ background:bg, border:`1px solid ${T.border}`,
                                                  borderRadius:10, padding:"14px 18px", boxShadow:shadow }}>
                            <div style={{ fontSize:11, fontWeight:600, color:T.text2,
                                          textTransform:"uppercase", letterSpacing:.6, marginBottom:6 }}>
                                {label}
                            </div>
                            <div style={{ fontSize:26, fontWeight:700, color }}>{value}</div>
                        </div>
                    ))}
                </div>
            )}

            {/* Quick action banner when there are failures */}
            {summary.failed > 0 && (
                <Alert type="warning" icon="⚠️">
                    {summary.failed} email(s) failed to deliver. Use the <strong>Resend</strong> button
                    on each row, or click <strong>Send Reminders to All Groups</strong> to re-notify everyone.
                </Alert>
            )}

            <Card>
                <FilterBar>
                    <SearchWrap placeholder="Search group or email…" value={search}
                                onChange={e => setSearch(e.target.value)}/>
                    <FG label="Type">
                        <Select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
                                style={{ minWidth:170 }}>
                            <option value="ALL">All Types</option>
                            <option value="SCHEDULE_PUBLISHED">Schedule Published</option>
                            <option value="SLOT_ASSIGNED">Slot Assigned</option>
                            <option value="REMINDER">Reminder</option>
                        </Select>
                    </FG>
                    <FG label="Status">
                        <Select value={statFilter} onChange={e => setStatFilter(e.target.value)}
                                style={{ minWidth:140 }}>
                            <option value="ALL">All Statuses</option>
                            <option value="SENT">Sent</option>
                            <option value="FAILED">Failed</option>
                            <option value="PENDING">Pending</option>
                        </Select>
                    </FG>
                </FilterBar>

                <table style={{ width:"100%", borderCollapse:"collapse" }}>
                    <thead><tr>
                        <Th>Group</Th><Th>Recipients</Th><Th>Email Type</Th>
                        <Th>Sent At</Th><Th>Status</Th><Th>Retries</Th><Th>Actions</Th>
                    </tr></thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={7} style={{ textAlign:"center", padding:24, color:T.text2 }}>
                                Loading email logs…
                            </td></tr>
                        ) : filtered.length === 0 ? (
                            <tr><td colSpan={7} style={{ textAlign:"center", padding:24, color:T.text3 }}>
                                {activeScheduleId ? "No email logs match your filters." : "Select a schedule first."}
                            </td></tr>
                        ) : filtered.map(l => (
                            <tr key={l.email_log_id}
                                style={{ borderBottom:`1px solid ${T.border}`,
                                         background:l.delivery_status==="FAILED"?"#fff8f8":"" }}>
                                <TdMain
                                    main={l.group_label || `Log #${l.email_log_id}`}
                                    sub={l.recipient_emails
                                        ? l.recipient_emails.length > 50
                                            ? l.recipient_emails.substring(0, 50) + "…"
                                            : l.recipient_emails
                                        : "—"}
                                />
                                <Td>
                                    <Badge color="blue">
                                        {l.recipient_count != null ? `${l.recipient_count} student(s)` : "—"}
                                    </Badge>
                                </Td>
                                <Td>
                                    <Badge color={emailTypeColor(l.email_type)}>
                                        {EMAIL_TYPE_LABELS[l.email_type] || l.email_type}
                                    </Badge>
                                </Td>
                                <Td mono>
                                    {l.sent_at
                                        ? new Date(l.sent_at).toLocaleString("en-GB",
                                            { day:"2-digit", month:"short", hour:"2-digit", minute:"2-digit" })
                                        : "—"}
                                </Td>
                                <Td><Badge color={statusColor(l.delivery_status)}>{l.delivery_status}</Badge></Td>
                                <Td mono style={{ color: l.retry_count > 0 ? T.red : T.text2 }}>
                                    {l.retry_count ?? 0}
                                </Td>
                                <Td>
                                    <div style={{ display:"flex", gap:6 }}>
                                        <Btn variant="ghost" size="xs" onClick={() => setPreviewLog(l)}>
                                            Details
                                        </Btn>
                                        <Btn variant="outline" size="xs"
                                             disabled={resending === l.email_log_id}
                                             onClick={() => handleResend(l)}>
                                            {resending === l.email_log_id ? "…" : "↺ Resend"}
                                        </Btn>
                                    </div>
                                </Td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {!loading && logs.length > 0 && (
                    <div style={{ padding:"12px 22px", borderTop:`1px solid ${T.border}`,
                                  display:"flex", alignItems:"center", gap:24, fontSize:12.5, color:T.text2 }}>
                        <span>Total: <strong style={{ color:T.text }}>{summary.total}</strong></span>
                        <span>Sent: <strong style={{ color:T.green }}>{summary.sent}</strong></span>
                        <span>Failed: <strong style={{ color:T.red }}>{summary.failed}</strong></span>
                        <span>Pending: <strong style={{ color:T.yellow }}>{summary.pending}</strong></span>
                    </div>
                )}
            </Card>

            {previewLog && <PreviewModal log={previewLog} onClose={() => setPreviewLog(null)}/>}
        </>
    );
};
// ════════════════════════════════════════════════════════════════
// SCREEN 5.8 — STUDENT SCHEDULE VIEW (static UI)
// ════════════════════════════════════════════════════════════════

const Screen58 = () => {
    const [schedules, setSchedules] = useState([]);
    const [loading,   setLoading]   = useState(true);
    const [error,     setError]     = useState("");

    useEffect(() => {
        axios.get(`${BASE}/student/schedules`)
            .then(r => setSchedules(r.data.schedules || []))
            .catch(() => setError("Failed to load student schedules."))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return (
        <div style={{ textAlign:"center", padding:40, color:T.text2 }}>Loading schedules…</div>
    );

    if (error) return (
        <div style={{ padding:"12px 16px", background:T.redBg, borderRadius:8,
                      color:T.red, fontSize:13, border:`1px solid #fca5a5` }}>{error}</div>
    );

    return (
        <>
            <ScreenLabel num="5.8" label="Student — My Evaluation Schedule UI"/>
            <div style={{ background:"linear-gradient(135deg,#1e40af 0%,#2563eb 100%)",
                          borderRadius:radius, padding:"18px 22px",
                          display:"flex", alignItems:"center", gap:16, marginBottom:24, color:"white" }}>
                <span style={{ fontSize:28 }}>📅</span>
                <div>
                    <h3 style={{ fontSize:15, fontWeight:700, margin:0 }}>Published Evaluation Schedules</h3>
                    <p style={{ fontSize:12.5, opacity:.8, marginTop:3, margin:0 }}>
                        All published schedules with assigned group slots.
                    </p>
                </div>
            </div>

            {schedules.length === 0 ? (
                <div style={{ textAlign:"center", padding:40, color:T.text3, fontSize:13 }}>
                    No published schedules found.
                </div>
            ) : schedules.map(sched => (
                <Card key={sched.evaluation_schedule_id}>
                    <CardHeader
                        title={sched.schedule_title}
                        sub={`${sched.assessment_title} · ${sched.location.location_name} · ${sched.location.room_number}`}
                        right={
                            <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                                <Badge color="blue">{sched.summary.assigned} / {sched.summary.total_slots} Assigned</Badge>
                                <Badge color="green">PUBLISHED</Badge>
                            </div>
                        }
                    />
                    <div style={{ padding:"10px 22px", background:T.bg, borderBottom:`1px solid ${T.border}`,
                                  display:"flex", gap:24, fontSize:12.5, color:T.text2, flexWrap:"wrap" }}>
                        <span>📅 <strong style={{ color:T.text }}>
                            {new Date(sched.date).toLocaleDateString("en-GB",
                                { day:"2-digit", month:"short", year:"numeric" })}
                        </strong></span>
                        <span>🕐 <strong style={{ color:T.text }}>
                            {fmtTime(sched.start_time)} – {fmtTime(sched.end_time)}
                        </strong></span>
                        <span>📍 <strong style={{ color:T.text }}>
                            {sched.location.building_name} · {sched.location.room_number}
                        </strong></span>
                        <span>⏱ <strong style={{ color:T.text }}>
                            {sched.duration_per_group_minutes} min/group
                        </strong></span>
                    </div>
                    <table style={{ width:"100%", borderCollapse:"collapse" }}>
                        <thead><tr>
                            <Th>Slot #</Th><Th>Time</Th><Th>Group</Th>
                            <Th>Attendance</Th><Th>Eval Done</Th><Th>Status</Th>
                        </tr></thead>
                        <tbody>
                            {sched.slots.length === 0 ? (
                                <tr><td colSpan={6} style={{ textAlign:"center", padding:20, color:T.text3 }}>
                                    No slots found.
                                </td></tr>
                            ) : sched.slots.map(slot => (
                                <tr key={slot.evaluation_slot_id}
                                    style={{ borderBottom:`1px solid ${T.border}`,
                                             background:slot.slot_status==="ASSIGNED"?"#f0f9ff":"" }}>
                                    <Td mono style={{ color:T.text2 }}>#{slot.slot_sequence_no}</Td>
                                    <Td mono style={{ color:slot.slot_status==="ASSIGNED"?T.blue:T.text2 }}>
                                        {fmtTime(slot.slot_start_time)} – {fmtTime(slot.slot_end_time)}
                                    </Td>
                                    <Td>
                                        {slot.group_id
                                            ? <span style={{ fontWeight:600, color:T.green }}>
                                                {slot.group_label}
                                              </span>
                                            : <span style={{ color:T.text3 }}>— Unassigned —</span>
                                        }
                                    </Td>
                                    <Td>
                                        <Badge color={
                                            slot.attendance_status==="PRESENT"?"green":
                                            slot.attendance_status==="ABSENT"?"red":"gray"
                                        }>
                                            {slot.attendance_status || "—"}
                                        </Badge>
                                    </Td>
                                    <Td>
                                        <Badge color={slot.evaluation_completed?"green":"gray"}>
                                            {slot.evaluation_completed?"✓ Done":"—"}
                                        </Badge>
                                    </Td>
                                    <Td>
                                        <Badge color={slot.slot_status==="ASSIGNED"?"green":"yellow"}>
                                            {slot.slot_status}
                                        </Badge>
                                    </Td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <div style={{ padding:"12px 22px", borderTop:`1px solid ${T.border}` }}>
                        <Alert type="info" icon="📧">
                            Email notifications are disabled in this platform version.
                            Contact your lecturer if your slot remains <strong>Pending</strong> for an extended period.
                        </Alert>
                    </div>
                </Card>
            ))}
        </>
    );
};

// ════════════════════════════════════════════════════════════════
// MAIN APP
// ════════════════════════════════════════════════════════════════
const SCREENS = [
    { id:"5.1", label:"Location Management"    },
    { id:"5.2", label:"Create Schedule"        },
    { id:"5.3", label:"Schedule List"          },
    { id:"5.4", label:"Auto Slot Preview"      },
    { id:"5.5", label:"Group Assignment"       },
    { id:"5.6", label:"Conflict & Publication" },
    { id:"5.7", label:"Email Notification Log" },
    { id:"5.8", label:"Student Schedule View"  },
];

export default function App() {
    const [active,           setActive]           = useState("5.1");
    const [activeScheduleId, setActiveScheduleId] = useState(null);

    const navigate = (screenId) => setActive(screenId);

    const sharedProps = { navigate, activeScheduleId, setActiveScheduleId };

    const renderScreen = () => {
        switch (active) {
            case "5.1": return <Screen51/>;
            case "5.2": return <Screen52 {...sharedProps}/>;
            case "5.3": return <Screen53 {...sharedProps}/>;
            case "5.4": return <Screen54 {...sharedProps}/>;
            case "5.5": return <Screen55 {...sharedProps}/>;
            case "5.6": return <Screen56 {...sharedProps}/>;
            case "5.7": return <Screen57 {...sharedProps}/>;
            case "5.8": return <Screen58/>;
            default:    return <Screen51/>;
        }
    };

    return (
        <div style={{ fontFamily:font, fontSize:14, background:T.bg, minHeight:"100vh" }}>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Mono:wght@400;500&display=swap');
                * { box-sizing:border-box; margin:0; padding:0; }
                html { font-size:14px; }
                body { background:${T.bg}; }
                input[type=number]::-webkit-inner-spin-button { opacity:1; }
            `}</style>

            <LecturerNavbar activePage="Evaluation" />

            <div style={{ display:"flex", maxWidth:1240, margin:"0 auto", padding:"32px 24px 60px", gap:24 }}>
                {/* Sidebar */}
                <div style={{ width:220, flexShrink:0 }}>
                    <div style={{ background:T.white, border:`1px solid ${T.border}`, borderRadius:radius,
                                  boxShadow:shadow, overflow:"hidden", position:"sticky", top:94 }}>
                        <div style={{ padding:"14px 16px", borderBottom:`1px solid ${T.border}`, background:T.navy }}>
                            <div style={{ fontSize:11, fontWeight:700, color:"rgba(255,255,255,.6)",
                                          textTransform:"uppercase", letterSpacing:.8 }}>Member 5</div>
                            <div style={{ fontSize:13, fontWeight:700, color:"white", marginTop:2 }}>Evaluation Scheduling</div>
                            {activeScheduleId && (
                                <div style={{ fontSize:11, color:"rgba(255,255,255,.5)", marginTop:4, fontFamily:mono }}>
                                    Active: #{activeScheduleId}
                                </div>
                            )}
                        </div>
                        {SCREENS.map(s => (
                            <div key={s.id} onClick={() => navigate(s.id)}
                                 style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 16px",
                                          cursor:"pointer", borderBottom:`1px solid ${T.border}`,
                                          background:active===s.id?T.blueL:"transparent",
                                          borderLeft:`3px solid ${active===s.id?T.blue:"transparent"}`,
                                          transition:"all .15s" }}>
                                <span style={{ fontFamily:mono, fontSize:11, fontWeight:700,
                                               color:active===s.id?T.blue:T.text3, minWidth:28 }}>{s.id}</span>
                                <span style={{ fontSize:12.5, fontWeight:active===s.id?600:400,
                                               color:active===s.id?T.blue:T.text2, lineHeight:1.3 }}>{s.label}</span>
                            </div>
                        ))}
                    </div>
                </div>
                {/* Main content */}
                <div style={{ flex:1, minWidth:0 }}>{renderScreen()}</div>
            </div>
        </div>
    );
}
