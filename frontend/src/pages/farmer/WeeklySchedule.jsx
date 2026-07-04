import { useEffect, useState } from "react";
import { jsPDF } from "jspdf";
import { toast } from "react-toastify";
import Button from "../../components/ui/Button";
import BackButton from "../../components/BackButton";
import { fetchWeeklySchedules, generateWeeklySchedule } from "../../services/smartAgriService";
import { generateWeeklyPlanInsight } from "../../services/geminiService";
import { useLanguage } from "../../context/LanguageContext";

export default function WeeklySchedule() {
  const { t, language } = useLanguage();
  const [form, setForm] = useState({
    cropName: "Tomato",
    scheduleType: "ORGANIC",
    totalWeeks: 8,
    landAreaAcres: 1,
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [aiSummary, setAiSummary] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const data = await fetchWeeklySchedules();
      setHistory(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to load schedules", error);
    }
  };

  const handleGenerate = async () => {
    try {
      setLoading(true);
      const payload = {
        ...form,
        totalWeeks: Number(form.totalWeeks),
        landAreaAcres: Number(form.landAreaAcres),
      };
      const data = await generateWeeklySchedule(payload);
      setResult(data);
      setAiSummary("");
      toast.success(t("farmer.weeklySchedule.toastSuccess"));
      loadHistory();
    } catch (error) {
      console.error(error);
      toast.error(error?.response?.data?.message || t("farmer.weeklySchedule.toastError"));
    } finally {
      setLoading(false);
    }
  };

  const generateAiSummary = async () => {
    if (!result) return;
    try {
      setAiLoading(true);
      const summary = await generateWeeklyPlanInsight({
        cropName: result.cropName,
        scheduleType: result.scheduleType,
        totalWeeks: result.totalWeeks,
        landAreaAcres: result.landAreaAcres,
        weeks: result.weeks,
      });
      setAiSummary(summary);
    } catch (error) {
      console.error(error);
      toast.error(t("farmer.weeklySchedule.toastAiError"));
    } finally {
      setAiLoading(false);
    }
  };

  const exportPdf = () => {
    if (!result) return;
    const doc = new jsPDF();
    let y = 16;
    doc.setFontSize(16);
    doc.text(`${t("farmer.weeklySchedule.pdfTitle")} - ${result.cropName}`, 14, y);
    y += 8;
    doc.setFontSize(11);
    doc.text(`${t("farmer.weeklySchedule.pdfType")}: ${result.scheduleType} | ${t("farmer.weeklySchedule.pdfArea")}: ${result.landAreaAcres} ${t("farmer.landMeasurement.acres")}`, 14, y);
    y += 10;

    result.weeks.forEach((week) => {
      if (y > 260) {
        doc.addPage();
        y = 16;
      }
      doc.setFontSize(12);
      doc.text(`${t("farmer.weeklySchedule.week")} ${week.weekNumber}: ${week.focus}`, 14, y);
      y += 6;
      doc.setFontSize(10);
      week.tasks.forEach((task) => {
        const lines = doc.splitTextToSize(`- ${task}`, 180);
        doc.text(lines, 16, y);
        y += lines.length * 5;
      });
      y += 3;
    });
    doc.save(`agriease-${result.cropName.toLowerCase()}-weekly-plan.pdf`);
  };

  return (
    <div className="smart-page">
      <BackButton />
      <div className="page-hero smart-hero smart-hero-schedule">
        <h1>{t("farmer.weeklySchedule.title")}</h1>
        <p>{t("farmer.weeklySchedule.subtitle")}</p>
      </div>

      <section className="widget-card smart-form">
        <div className="smart-grid-two">
          <div className="form-group">
            <label>{t("farmer.weeklySchedule.crop")}</label>
            <input
              className="input"
              value={form.cropName}
              onChange={(e) => setForm((prev) => ({ ...prev, cropName: e.target.value }))}
            />
          </div>
          <div className="form-group">
            <label>{t("farmer.weeklySchedule.planType")}</label>
            <select
              className="input"
              value={form.scheduleType}
              onChange={(e) => setForm((prev) => ({ ...prev, scheduleType: e.target.value }))}
            >
              <option value="ORGANIC">{t("farmer.weeklySchedule.organic")}</option>
              <option value="INORGANIC">{t("farmer.weeklySchedule.inorganic")}</option>
            </select>
          </div>
          <div className="form-group">
            <label>{t("farmer.weeklySchedule.totalWeeks")}</label>
            <input
              className="input"
              type="number"
              min="4"
              max="16"
              value={form.totalWeeks}
              onChange={(e) => setForm((prev) => ({ ...prev, totalWeeks: e.target.value }))}
            />
          </div>
          <div className="form-group">
            <label>{t("farmer.weeklySchedule.landArea")}</label>
            <input
              className="input"
              type="number"
              min="0.1"
              step="0.1"
              value={form.landAreaAcres}
              onChange={(e) => setForm((prev) => ({ ...prev, landAreaAcres: e.target.value }))}
            />
          </div>
        </div>
        <div className="smart-inline">
          <Button className="btn primary" onClick={handleGenerate} disabled={loading}>
            {loading ? t("farmer.weeklySchedule.generating") : t("farmer.weeklySchedule.generatePlan")}
          </Button>
          <Button className="btn ghost" onClick={generateAiSummary} disabled={!result || aiLoading}>
            {aiLoading ? t("farmer.weeklySchedule.generatingAiSummary") : t("farmer.weeklySchedule.generateAiSummary")}
          </Button>
          <Button className="btn ghost" onClick={exportPdf} disabled={!result}>
            {t("farmer.weeklySchedule.exportPdf")}
          </Button>
        </div>
      </section>

      {result && (
        <section className="widget-card">
          <h3>{result.cropName} - {result.scheduleType} {t("farmer.weeklySchedule.plan")}</h3>
          {aiSummary && <p className="data-sync-meta">{aiSummary}</p>}
          <div className="smart-grid">
            {result.weeks.map((week) => (
              <article className="smart-card" key={week.weekNumber}>
                <h4>{t("farmer.weeklySchedule.week")} {week.weekNumber}</h4>
                <p className="smart-focus">{week.focus}</p>
                <ul className="smart-list">
                  {week.tasks.map((task, idx) => (
                    <li key={`${week.weekNumber}-${idx}`}>{task}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>
      )}

      <section className="widget-card">
        <h3>{t("farmer.weeklySchedule.savedHistory")}</h3>
        {history.length === 0 ? (
          <p className="empty-state">{t("farmer.weeklySchedule.noSchedules")}</p>
        ) : (
          <div className="smart-table">
            {history.slice(0, 8).map((item) => (
              <div className="smart-row" key={item.id}>
                <strong>{item.cropName}</strong>
                <span>{item.scheduleType}</span>
                <span>{item.totalWeeks} {t("farmer.weeklySchedule.weeks")}</span>
                <span>{new Date(item.createdAt).toLocaleString(language === "mr" ? "mr-IN" : undefined)}</span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
