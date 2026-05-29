import { useState } from "react";
import { RiArrowRightLine, RiArrowLeftLine, RiCheckLine, RiTimeLine, RiFileLine, RiUploadLine } from "react-icons/ri";
import api from '../../services/api';

const STEPS = [
  { id: "personal",  label: "Personal",  sub: "Basic info" },
  { id: "academics", label: "Academics", sub: "Education" },
  { id: "documents", label: "Documents", sub: "Upload files" },
  { id: "payment",   label: "Payment",   sub: "Fee & submit" },
  { id: "status",    label: "Status",    sub: "Approval status" },
];

const PROGRAMS = [
  "Certified Management Professional (CMP)",
  "Business Analytics & Strategy",
  "Digital Marketing Leadership",
  "Finance & Investment Management",
  "Entrepreneurship & Innovation",
];

const COUNTRY_CODES = ["+91", "+1", "+44", "+61", "+971", "+65"];

function Field({ label, error, required, children }) {
  return (
    <div className="input-field">
      <label className="input-field__label">
        {label} {required && <span className="input-field__required">*</span>}
      </label>
      {children}
      {error && <p className="input-field__error">{error}</p>}
    </div>
  );
}

function ThemedInput({ error, ...props }) {
  const [focused, setFocused] = useState(false);
  return (
    <input
      {...props}
      className={`input-field__control${focused ? " is-focused" : ""}${error ? " is-error" : ""}`}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
    />
  );
}

function ThemedSelect({ error, children, ...props }) {
  const [focused, setFocused] = useState(false);
  return (
    <select
      {...props}
      className={`input-field__control${focused ? " is-focused" : ""}${error ? " is-error" : ""}`}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
    >
      {children}
    </select>
  );
}

function StepIndicator({ currentStep, completedSteps }) {
  const currentIdx = STEPS.findIndex(s => s.id === currentStep);
  return (
    <div style={{ background: "var(--navy)", padding: "0", display: "flex" }}>
      {STEPS.map((step, idx) => {
        const done = completedSteps.includes(step.id);
        const active = step.id === currentStep;
        const past = idx < currentIdx;
        return (
          <div key={step.id} style={{
            flex: 1, display: "flex", flexDirection: "column", alignItems: "center",
            padding: "18px 12px 16px",
            borderBottom: active ? "3px solid var(--accent)" : "3px solid transparent",
            borderRight: idx < STEPS.length - 1 ? "1px solid rgba(255,255,255,0.06)" : "none",
            background: active ? "rgba(177,7,56,0.12)" : "transparent",
            transition: "all 0.2s", position: "relative",
          }}>
            <div style={{
              width: 32, height: 32, borderRadius: 0,
              display: "flex", alignItems: "center", justifyContent: "center",
              background: done || past ? "var(--accent)" : active ? "rgba(177,7,56,0.3)" : "rgba(255,255,255,0.08)",
              border: active && !done ? "1px solid var(--accent)" : "none",
              color: "#fff", fontSize: done || past ? 16 : 13, fontWeight: 700,
              marginBottom: 6, transition: "all 0.25s",
            }}>
              {done || past ? <RiCheckLine /> : idx + 1}
            </div>
            <span style={{
              fontSize: 12, fontWeight: active ? 700 : 500,
              color: active ? "#fff" : done || past ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.35)",
              letterSpacing: "0.04em", textTransform: "uppercase",
            }}>
              {step.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function DraftBanner({ completedSteps, onResume }) {
  const pct = Math.round((completedSteps.length / STEPS.length) * 100);
  return (
    <div style={{
      background: "var(--gold-dim)", border: "1px solid var(--gold)",
      padding: "14px 20px", display: "flex", alignItems: "center",
      justifyContent: "space-between", gap: 16, flexWrap: "wrap",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <RiTimeLine style={{ color: "var(--gold)", fontSize: 20, flexShrink: 0 }} />
        <div>
          <p style={{ margin: 0, fontWeight: 700, fontSize: 14, color: "var(--text-primary)" }}>
            Finish your application — {pct}% complete
          </p>
          <div style={{ display: "flex", gap: 4, marginTop: 6 }}>
            {STEPS.map(s => (
              <div key={s.id} style={{
                height: 3, width: 52,
                background: completedSteps.includes(s.id) ? "var(--gold)" : "var(--border)",
                transition: "background 0.3s",
              }} />
            ))}
          </div>
        </div>
      </div>
      <button onClick={onResume} className="app-button app-button--sm"
        style={{ background: "var(--gold)", color: "#fff", border: "none", borderRadius: 0, fontWeight: 700 }}>
        Continue →
      </button>
    </div>
  );
}

function ReviewingState({ personalData, status }) {
  const statusLabels = {
    pending: { label: "Pending Review", desc: "Your application has been received and is in queue.", color: "var(--gold)", bg: "var(--gold-dim)" },
    under_review: { label: "Under Review", desc: "Our admissions team is actively reviewing your details.", color: "var(--navy)", bg: "var(--surface-tint)" },
    approved: { label: "Approved", desc: "Congratulations! Your application has been approved.", color: "var(--green)", bg: "var(--green-dim)" },
    rejected: { label: "Rejected", desc: "We regret to inform you that your application was not approved.", color: "var(--red)", bg: "var(--red-dim)" }
  };

  const currentStatus = statusLabels[status] || { label: "Under Review", desc: "Our admissions team is reviewing your application.", color: "var(--green)", bg: "var(--green-dim)" };

  return (
    <div style={{ padding: "2.5rem" }}>
      <div style={{ marginBottom: "1.75rem" }}>
        <p style={{ margin: "0 0 4px", fontSize: 12, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--accent)" }}>
          Step 5 of 5
        </p>
        <h2 style={{ margin: "0 0 6px", fontSize: 28, fontWeight: 800, color: "var(--text-primary)" }}>Admission status</h2>
        <p style={{ margin: 0, fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.6 }}>
          Track the progress of your application review.
        </p>
      </div>

      <div style={{
        background: currentStatus.bg, border: `1px solid ${currentStatus.color}`,
        padding: "2rem", textAlign: "center", marginBottom: "1.5rem",
      }}>
        <div style={{
          width: 56, height: 56, background: currentStatus.color, margin: "0 auto 16px",
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "#fff", fontSize: 28,
        }}>
          <RiCheckLine />
        </div>
        <h3 style={{ margin: "0 0 8px", color: currentStatus.color, fontWeight: 800, fontSize: 20 }}>
          {currentStatus.label}
        </h3>
        <p style={{ margin: 0, fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.6 }}>
          {currentStatus.desc}<br />
          You'll hear back within 3–5 business days.
        </p>
      </div>
      <div style={{ border: "1px solid var(--border)", background: "var(--surface-tint)" }}>
        <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--border)", background: "var(--bg-hover)" }}>
          <p style={{ margin: 0, fontWeight: 700, fontSize: 13, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-secondary)" }}>
            Application summary
          </p>
        </div>
        {[["Name", personalData.name], ["Email", personalData.email], ["Program", personalData.program], ["Location", personalData.location]].map(([k, v]) => (
          <div key={k} style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            padding: "12px 20px", borderBottom: "1px solid var(--border)",
          }}>
            <span style={{ fontSize: 13, color: "var(--text-muted)", fontWeight: 600 }}>{k}</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", maxWidth: 320, textAlign: "right" }}>{v || "—"}</span>
          </div>
        ))}
        <div style={{ padding: "12px 20px" }}>
          <p style={{ margin: 0, fontSize: 12, color: "var(--text-muted)" }}>
            Application reference will be sent to your registered email within 24 hours.
          </p>
        </div>
      </div>
    </div>
  );
}

function PersonalStep({ data, onChange, onNext }) {
  const [errors, setErrors] = useState({});
  const validate = () => {
    const e = {};
    if (!data.name?.trim()) e.name = "Full name is required";
    if (!data.email?.trim() || !/\S+@\S+\.\S+/.test(data.email)) e.email = "Valid email required";
    if (!data.mobileNo?.trim() || !/^[0-9]{10}$/.test(data.mobileNo)) e.mobileNo = "Enter a valid 10-digit number";
    if (!data.location?.trim()) e.location = "Location is required";
    if (!data.program) e.program = "Please select a program";
    if (!data.agreeToTerms) e.agreeToTerms = "You must agree to continue";
    setErrors(e);
    return Object.keys(e).length === 0;
  };
  return (
    <div className="fade-up">
      <div style={{ marginBottom: "1.75rem" }}>
        <p style={{ margin: "0 0 4px", fontSize: 12, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--accent)" }}>
          Step 1 of 5
        </p>
        <h2 style={{ margin: "0 0 6px", fontSize: 28, fontWeight: 800, color: "var(--text-primary)" }}>Personal details</h2>
        <p style={{ margin: 0, fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.6 }}>
          Tell us about yourself so we can create your profile.
        </p>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 1.5rem" }}>
        <div style={{ gridColumn: "1 / -1" }}>
          <Field label="Full name" required error={errors.name}>
            <ThemedInput value={data.name || ""} placeholder="e.g. Priya Sharma" error={errors.name}
              onChange={e => onChange({ ...data, name: e.target.value })} />
          </Field>
        </div>
        <Field label="Email address" required error={errors.email}>
          <ThemedInput type="email" value={data.email || ""} placeholder="priya@example.com" error={errors.email}
            onChange={e => onChange({ ...data, email: e.target.value })} />
        </Field>
        <Field label="Mobile number" required error={errors.mobileNo}>
          <div style={{ display: "flex", gap: 8 }}>
            <ThemedSelect value={data.countryCode || "+91"} style={{ width: 88, flexShrink: 0 }}
              onChange={e => onChange({ ...data, countryCode: e.target.value })}>
              {COUNTRY_CODES.map(c => <option key={c}>{c}</option>)}
            </ThemedSelect>
            <ThemedInput type="tel" value={data.mobileNo || ""} placeholder="10-digit number" error={errors.mobileNo}
              onChange={e => onChange({ ...data, mobileNo: e.target.value })} style={{ flex: 1 }} />
          </div>
          {errors.mobileNo && <p className="input-field__error">{errors.mobileNo}</p>}
        </Field>
        <Field label="City / Location" required error={errors.location}>
          <ThemedInput value={data.location || ""} placeholder="e.g. Mumbai, India" error={errors.location}
            onChange={e => onChange({ ...data, location: e.target.value })} />
        </Field>
        <div style={{ gridColumn: "1 / -1" }}>
          <Field label="Program" required error={errors.program}>
            <ThemedSelect value={data.program || ""} error={errors.program}
              onChange={e => onChange({ ...data, program: e.target.value })}>
              <option value="">Select a program</option>
              {PROGRAMS.map(p => <option key={p} value={p}>{p}</option>)}
            </ThemedSelect>
          </Field>
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: "1.75rem" }}>
        <input type="checkbox" id="terms" checked={!!data.agreeToTerms}
          onChange={e => onChange({ ...data, agreeToTerms: e.target.checked })}
          style={{ marginTop: 3, flexShrink: 0, accentColor: "var(--accent)", width: 15, height: 15 }} />
        <label htmlFor="terms" style={{ fontSize: 13, color: "var(--text-secondary)", cursor: "pointer", lineHeight: 1.6 }}>
          I agree to the{" "}
          <span style={{ color: "var(--accent)", fontWeight: 600, textDecoration: "underline" }}>Privacy Policy</span>
          {" "}and{" "}
          <span style={{ color: "var(--accent)", fontWeight: 600, textDecoration: "underline" }}>Terms of Use</span>.
        </label>
      </div>
      {errors.agreeToTerms && <p className="input-field__error" style={{ marginTop: -12, marginBottom: 16 }}>{errors.agreeToTerms}</p>}
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button className="app-button app-button--primary app-button--md" style={{ borderRadius: 0 }}
          onClick={() => { if (validate()) onNext(); }}>
          Continue to Academics <RiArrowRightLine style={{ fontSize: 18 }} />
        </button>
      </div>
    </div>
  );
}

function AcademicsStep({ data, onChange, onNext, onBack }) {
  const [errors, setErrors] = useState({});
  const validate = () => {
    const e = {};
    if (!data.highestQualification) e.highestQualification = "Required";
    if (!data.institution?.trim()) e.institution = "Institution name required";
    if (!data.graduationYear?.trim()) e.graduationYear = "Required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };
  return (
    <div className="fade-up">
      <div style={{ marginBottom: "1.75rem" }}>
        <p style={{ margin: "0 0 4px", fontSize: 12, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--accent)" }}>
          Step 2 of 5
        </p>
        <h2 style={{ margin: "0 0 6px", fontSize: 28, fontWeight: 800, color: "var(--text-primary)" }}>Academic background</h2>
        <p style={{ margin: 0, fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.6 }}>
          Share your educational qualifications and experience.
        </p>
      </div>
      <Field label="Highest qualification" required error={errors.highestQualification}>
        <ThemedSelect value={data.highestQualification || ""} error={errors.highestQualification}
          onChange={e => onChange({ ...data, highestQualification: e.target.value })}>
          <option value="">Select qualification</option>
          {["High School (12th / HSC)", "Diploma", "Bachelor's Degree", "Master's Degree", "PhD / Doctorate", "Other"].map(q =>
            <option key={q}>{q}</option>)}
        </ThemedSelect>
      </Field>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 1.5rem" }}>
        <Field label="Institution / University" required error={errors.institution}>
          <ThemedInput value={data.institution || ""} placeholder="e.g. University of Delhi" error={errors.institution}
            onChange={e => onChange({ ...data, institution: e.target.value })} />
        </Field>
        <Field label="Year of graduation" required error={errors.graduationYear}>
          <ThemedInput value={data.graduationYear || ""} placeholder="e.g. 2022" error={errors.graduationYear}
            onChange={e => onChange({ ...data, graduationYear: e.target.value })} />
        </Field>
        <Field label="Field of study">
          <ThemedInput value={data.fieldOfStudy || ""} placeholder="e.g. Commerce / Engineering"
            onChange={e => onChange({ ...data, fieldOfStudy: e.target.value })} />
        </Field>
        <Field label="GPA / Percentage">
          <ThemedInput value={data.gpa || ""} placeholder="e.g. 8.4 / 85%"
            onChange={e => onChange({ ...data, gpa: e.target.value })} />
        </Field>
      </div>
      <Field label="Work experience">
        <ThemedInput value={data.workExperience || ""} placeholder="e.g. 2 years in Sales at XYZ Corp"
          onChange={e => onChange({ ...data, workExperience: e.target.value })} />
      </Field>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: "0.5rem" }}>
        <button className="app-button app-button--secondary app-button--md" style={{ borderRadius: 0 }} onClick={onBack}>
          <RiArrowLeftLine /> Back
        </button>
        <button className="app-button app-button--primary app-button--md" style={{ borderRadius: 0 }}
          onClick={() => { if (validate()) onNext(); }}>
          Continue to Documents <RiArrowRightLine style={{ fontSize: 18 }} />
        </button>
      </div>
    </div>
  );
}

function DocumentsStep({ data, onChange, onNext, onBack }) {
  const [errors, setErrors] = useState({});
  const docs = [
    { key: "photoId",   label: "Photo ID",             sub: "Aadhar / Passport — PDF or image, max 5 MB", required: true },
    { key: "marksheet", label: "Latest marksheet",      sub: "Degree / marksheet — PDF, max 5 MB",         required: true },
    { key: "photo",     label: "Passport photograph",   sub: "JPG or PNG, max 2 MB",                       required: true },
    { key: "workProof", label: "Work experience letter", sub: "Optional — PDF or image",                   required: false },
  ];
  const validate = () => {
    const e = {};
    docs.filter(d => d.required).forEach(d => { if (!data[d.key]) e[d.key] = "This document is required"; });
    setErrors(e);
    return Object.keys(e).length === 0;
  };
  return (
    <div className="fade-up">
      <div style={{ marginBottom: "1.75rem" }}>
        <p style={{ margin: "0 0 4px", fontSize: 12, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--accent)" }}>
          Step 3 of 5
        </p>
        <h2 style={{ margin: "0 0 6px", fontSize: 28, fontWeight: 800, color: "var(--text-primary)" }}>Upload documents</h2>
        <p style={{ margin: 0, fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.6 }}>
          Upload clear scans or photos of the following documents.
        </p>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: "1.5rem" }}>
        {docs.map(doc => {
          const uploaded = !!data[doc.key];
          return (
            <div key={doc.key} style={{
              border: `1px solid ${errors[doc.key] ? "var(--red)" : uploaded ? "var(--green)" : "var(--border)"}`,
              background: uploaded ? "var(--green-dim)" : "var(--surface-tint)",
              padding: "14px 18px",
              display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16,
              transition: "all 0.2s",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{
                  width: 38, height: 38, flexShrink: 0,
                  background: uploaded ? "var(--green)" : "var(--bg-hover)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: uploaded ? "#fff" : "var(--text-muted)", fontSize: 18,
                }}>
                  {uploaded ? <RiCheckLine /> : <RiFileLine />}
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>
                    {doc.label}
                    {doc.required && <span style={{ color: "var(--red)", marginLeft: 3 }}>*</span>}
                  </p>
                  <p style={{ margin: "2px 0 0", fontSize: 12, color: uploaded ? "var(--green)" : "var(--text-muted)" }}>
                    {uploaded ? `✓ ${data[doc.key]?.name ?? data[doc.key]}` : doc.sub}
                  </p>
                  {errors[doc.key] && <p style={{ margin: "2px 0 0", fontSize: 12, color: "var(--red)", fontWeight: 600 }}>{errors[doc.key]}</p>}
                </div>
              </div>
              <label style={{
                display: "flex", alignItems: "center", gap: 6,
                cursor: "pointer", fontSize: 13, fontWeight: 700,
                color: uploaded ? "var(--green)" : "var(--accent)",
                background: "#fff",
                border: `1px solid ${uploaded ? "var(--green)" : "var(--border-hover)"}`,
                padding: "7px 14px", whiteSpace: "nowrap", transition: "all 0.2s",
              }}>
                <RiUploadLine style={{ fontSize: 15 }} />
                {uploaded ? "Change" : "Upload"}
                <input type="file" style={{ display: "none" }} accept=".pdf,.jpg,.jpeg,.png"
                  onChange={e => {
                    if (e.target.files[0]) {
                      onChange({ ...data, [doc.key]: e.target.files[0] });
                      setErrors(err => ({ ...err, [doc.key]: undefined }));
                    }
                  }} />
              </label>
            </div>
          );
        })}
      </div>
      <p style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: "1.5rem" }}>
        🔒 All documents are encrypted and stored securely. Used only for verification.
      </p>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <button className="app-button app-button--secondary app-button--md" style={{ borderRadius: 0 }} onClick={onBack}>
          <RiArrowLeftLine /> Back
        </button>
        <button className="app-button app-button--primary app-button--md" style={{ borderRadius: 0 }}
          onClick={() => { if (validate()) onNext(); }}>
          Continue to Payment <RiArrowRightLine style={{ fontSize: 18 }} />
        </button>
      </div>
    </div>
  );
}

function PaymentStep({ personalData, onSubmit, onBack, isSubmitting, paymentMethod, onMethodChange }) {
  const [agreed, setAgreed] = useState(false);
  const fee = 1999;
  const methods = [
    { id: "card",       label: "Debit / Credit Card" },
    { id: "upi",        label: "UPI" },
    { id: "netbanking", label: "Net Banking" },
  ];
  return (
    <div className="fade-up">
      <div style={{ marginBottom: "1.75rem" }}>
        <p style={{ margin: "0 0 4px", fontSize: 12, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--accent)" }}>
          Step 4 of 5
        </p>
        <h2 style={{ margin: "0 0 6px", fontSize: 28, fontWeight: 800, color: "var(--text-primary)" }}>Application fee</h2>
        <p style={{ margin: 0, fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.6 }}>
          A one-time non-refundable processing fee to submit your application.
        </p>
      </div>
      <div style={{ border: "1px solid var(--border)", marginBottom: "1.5rem", background: "var(--surface-tint)" }}>
        <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--border)", background: "var(--bg-hover)" }}>
          <p style={{ margin: 0, fontSize: 12, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-muted)" }}>
            Fee breakdown
          </p>
        </div>
        <div style={{ padding: "14px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border)" }}>
          <span style={{ fontSize: 14, color: "var(--text-secondary)" }}>Selected program</span>
          <span style={{ fontSize: 13, fontWeight: 600, maxWidth: 280, textAlign: "right" }}>{personalData?.program || "—"}</span>
        </div>
        <div style={{ padding: "14px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontWeight: 700, fontSize: 15 }}>Application fee</span>
          <span style={{ fontWeight: 800, fontSize: 22, color: "var(--accent)" }}>₹{fee.toLocaleString()}</span>
        </div>
      </div>
      <div style={{ marginBottom: "1.5rem" }}>
        <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text-secondary)", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.06em" }}>
          Payment method
        </p>
        <div style={{ display: "flex", gap: 10 }}>
          {methods.map(m => (
            <button key={m.id} onClick={() => onMethodChange(m.id)} style={{
              flex: 1, padding: "12px 10px",
              border: paymentMethod === m.id ? "2px solid var(--accent)" : "1px solid var(--border)",
              background: paymentMethod === m.id ? "var(--accent-dim)" : "var(--surface-tint)",
              color: paymentMethod === m.id ? "var(--accent)" : "var(--text-secondary)",
              fontWeight: paymentMethod === m.id ? 700 : 500,
              fontSize: 13, cursor: "pointer", transition: "all 0.18s",
              borderRadius: 0, fontFamily: "var(--font-body)",
            }}>
              {m.label}
            </button>
          ))}
        </div>
      </div>
      {paymentMethod === "card" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          <Field label="Card number" required><ThemedInput placeholder="1234  5678  9012  3456" /></Field>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 1.5rem" }}>
            <Field label="Expiry date" required><ThemedInput placeholder="MM / YY" /></Field>
            <Field label="CVV" required><ThemedInput placeholder="•••" type="password" /></Field>
          </div>
        </div>
      )}
      {paymentMethod === "upi" && (
        <Field label="UPI ID" required><ThemedInput placeholder="yourname@upi" /></Field>
      )}
      {paymentMethod === "netbanking" && (
        <Field label="Select your bank" required>
          <ThemedSelect>
            <option>State Bank of India</option>
            <option>HDFC Bank</option>
            <option>ICICI Bank</option>
            <option>Axis Bank</option>
            <option>Kotak Mahindra Bank</option>
          </ThemedSelect>
        </Field>
      )}
      <div style={{
        display: "flex", alignItems: "flex-start", gap: 10,
        padding: "14px 16px", background: "var(--accent-dim)",
        border: "1px solid rgba(177,7,56,0.15)", marginBottom: "1.5rem",
      }}>
        <input type="checkbox" id="pay-agree" checked={agreed}
          onChange={e => setAgreed(e.target.checked)}
          style={{ marginTop: 3, flexShrink: 0, accentColor: "var(--accent)", width: 15, height: 15 }} />
        <label htmlFor="pay-agree" style={{ fontSize: 13, color: "var(--text-secondary)", cursor: "pointer", lineHeight: 1.6 }}>
          I understand this is a <strong>non-refundable</strong> application processing fee and I authorise this payment.
        </label>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <button className="app-button app-button--secondary app-button--md" style={{ borderRadius: 0 }} onClick={onBack}>
          <RiArrowLeftLine /> Back
        </button>
        <button
          className="app-button app-button--primary app-button--md"
          style={{ borderRadius: 0, opacity: (!agreed || isSubmitting) ? 0.45 : 1, cursor: (!agreed || isSubmitting) ? "not-allowed" : "pointer" }}
          onClick={() => agreed && !isSubmitting && onSubmit()}
        >
          {isSubmitting
            ? <><span className="app-button__spinner" /> Processing…</>
            : <>Pay ₹{fee.toLocaleString()} &amp; Submit <RiArrowRightLine style={{ fontSize: 18 }} /></>
          }
        </button>
      </div>
    </div>
  );
}

// ── Main export ──────────────────────────────────────────────────────────────
export default function AdmissionPortal({ existingApplication = null }) {

  // ✅ FIXED: trust completedSteps and currentStep directly from the server
  const deriveCompleted = (app) => {
    if (!app) return [];
    if (app.status && app.status !== "draft") {
      return ["personal", "academics", "documents", "payment", "status"];
    }
    // Use server-stored completedSteps if available
    if (app.completedSteps?.length > 0) return [...app.completedSteps];
    // Fallback: derive from presence of data
    const done = [];
    if (app.name || app.email) done.push("personal");
    if (app.academics?.highestQualification || app.academics?.institution) done.push("academics");
    if (app.documents?.photoId || app.documents?.marksheet) done.push("documents");
    return done;
  };

  // ✅ FIXED: use currentStep from server directly
  const deriveStep = (app) => {
    if (!app) return "personal";
    if (app.status && app.status !== "draft") return "status";
    // Trust the server's currentStep — it's always up to date
    if (app.currentStep && app.currentStep !== "submitted") return app.currentStep;
    // Fallback: derive from completedSteps
    const completed = app.completedSteps || [];
    if (!completed.includes("personal"))  return "personal";
    if (!completed.includes("academics")) return "academics";
    if (!completed.includes("documents")) return "documents";
    return "payment";
  };

  const [currentStep, setCurrentStep]   = useState(() => deriveStep(existingApplication));
  const [completedSteps, setCompletedSteps] = useState(() => deriveCompleted(existingApplication));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted]       = useState(false);
  const [apiError, setApiError]         = useState(null);

  // ✅ FIXED: hydrate all personal fields from existing draft
  const [personalData, setPersonalData] = useState(
    existingApplication ? {
      name:         existingApplication.name        || "",
      email:        existingApplication.email       || "",
      location:     existingApplication.location    || "",
      program:      existingApplication.program     || "",
      countryCode:  existingApplication.countryCode || "+91",
      mobileNo:     existingApplication.mobileNo    || "",
      agreeToTerms: true,
    } : {}
  );

  // ✅ FIXED: hydrate academics from existing draft
  const [academicsData, setAcademicsData] = useState(
    existingApplication?.academics ? {
      highestQualification: existingApplication.academics.highestQualification || "",
      institution:          existingApplication.academics.institution          || "",
      graduationYear:       existingApplication.academics.graduationYear       || "",
      fieldOfStudy:         existingApplication.academics.fieldOfStudy         || "",
      gpa:                  existingApplication.academics.gpa                  || "",
      workExperience:       existingApplication.academics.workExperience       || "",
    } : {}
  );

  const [documentsData, setDocumentsData] = useState({});
  const [applicationId, setApplicationId] = useState(existingApplication?._id || null);
  const [paymentMethod, setPaymentMethod] = useState("card");

  const markComplete = (step) =>
    setCompletedSteps(prev => prev.includes(step) ? prev : [...prev, step]);

  const handlePersonalNext = async () => {
    setApiError(null);
    try {
      if (applicationId) {
        await api.put(`/applications/${applicationId}/personal`, personalData);
      } else {
        const res = await api.post('/applications', personalData);
        const appId = res.data?.data?.applicationId || res.data?.applicationId;
        if (!appId) throw new Error('No applicationId returned from server');
        setApplicationId(appId);
      }
      markComplete("personal");
      setCurrentStep("academics");
    } catch (err) {
      setApiError(err?.response?.data?.message || err?.message || "Failed to save personal details. Please try again.");
    }
  };

  const handleAcademicsNext = async () => {
    setApiError(null);
    try {
      await api.put(`/applications/${applicationId}/academics`, academicsData);
      markComplete("academics");
      setCurrentStep("documents");
    } catch (err) {
      setApiError(err?.response?.data?.message || err?.message || "Failed to save academic details. Please try again.");
    }
  };

  const handleDocumentsNext = async () => {
    setApiError(null);
    try {
      const form = new FormData();
      Object.entries(documentsData).forEach(([k, v]) => {
        if (v instanceof File) form.append(k, v);
      });
      await api.put(`/applications/${applicationId}/documents`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      markComplete("documents");
      setCurrentStep("payment");
    } catch (err) {
      setApiError(err?.response?.data?.message || err?.message || "Failed to upload documents. Please try again.");
    }
  };

  const handleSubmit = async () => {
    setApiError(null);
    setIsSubmitting(true);
    try {
      await api.put(`/applications/${applicationId}/payment`, {
        method: paymentMethod,
        transactionId: `TXN-${Date.now()}`,
        amount: 1999,
      });
      markComplete("payment");
      markComplete("status");
      setSubmitted(true);
      setCurrentStep("status");
    } catch (err) {
      setApiError(err?.response?.data?.message || err?.message || "Payment failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isDraft = completedSteps.length > 0 && completedSteps.length < STEPS.length && !submitted && currentStep !== "status";
  const goTo = (step) => { setApiError(null); setCurrentStep(step); };

  return (
    <div>
      {isDraft && (
        <DraftBanner
          completedSteps={completedSteps}
          onResume={() => {
            const next = STEPS.find(s => !completedSteps.includes(s.id));
            if (next) goTo(next.id);
          }}
        />
      )}
      <div style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)" }}>
        <StepIndicator currentStep={currentStep} completedSteps={completedSteps} />
        {apiError && (
          <div style={{
            margin: "1.5rem 3rem 0", padding: "12px 18px",
            background: "var(--accent-dim)", border: "1px solid var(--accent)",
            color: "var(--accent)", fontSize: 13, fontWeight: 600,
            display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
          }}>
            <span>⚠ {apiError}</span>
            <button onClick={() => setApiError(null)}
              style={{ background: "none", border: "none", color: "var(--accent)", cursor: "pointer", fontSize: 18, lineHeight: 1, padding: 0 }}>
              ×
            </button>
          </div>
        )}
        <div style={{ padding: "2.5rem 3rem" }}>
          {currentStep === "personal" && (
            <PersonalStep data={personalData} onChange={setPersonalData} onNext={handlePersonalNext} />
          )}
          {currentStep === "academics" && (
            <AcademicsStep data={academicsData} onChange={setAcademicsData}
              onNext={handleAcademicsNext} onBack={() => goTo("personal")} />
          )}
          {currentStep === "documents" && (
            <DocumentsStep data={documentsData} onChange={setDocumentsData}
              onNext={handleDocumentsNext} onBack={() => goTo("academics")} />
          )}
          {currentStep === "payment" && (
            <PaymentStep
              personalData={personalData}
              onSubmit={handleSubmit}
              onBack={() => goTo("documents")}
              isSubmitting={isSubmitting}
              paymentMethod={paymentMethod}
              onMethodChange={setPaymentMethod}
            />
          )}
          {currentStep === "status" && (
            <ReviewingState personalData={personalData} status={existingApplication?.status || (submitted ? "pending" : null)} />
          )}
        </div>
      </div>
    </div>
  );
}