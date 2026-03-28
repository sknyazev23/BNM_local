import { useState, useEffect, useMemo } from "react";
import { useParams } from "react-router-dom";
import { Plus, Save, Edit2, Trash2 } from "lucide-react";
import { toAED } from "../utils/currency";
import API from "../api";
import { format4, formatTableNumber } from "../utils/numberFormat";
import { buildJobApiData } from "../utils/buildJobApiData";
import ClientSelect from "../components/ClientSelect";
import { calcTotals } from "../utils/totalModals";
import EndSummary from "../components/EndSummary";
import AddExpenseModal from "../components/AddExpenseModal";
import AddSaleModal from "../components/AddSaleModal";
import TransactionHeader from "../components/TransactionHeader";
import useLoadJob from "../hooks/useLoadJob";
import useCloseJob from "../hooks/useCloseJob";
import DocSection from "../components/DocSection";
import { exportJobSummaryToExcel } from "../utils/exportJobExcel";
import {
  validateNonNegativeTwoDecimals,
  onlyPositiveDecimal4,
  blockPaste,
  decimal4Blur,
  decimal4Change,
} from "../utils/numberValidation";
import { ddmmyyyyToISO, isoToDDMMYYYY } from "../utils/dateFmt";
import "../styles/job.css";
import "../styles/endSummary.css";
import "../styles/docsUploadSection.css";


export default function JobForm() {
  const { id: routeId } = useParams();
  const [_id, setMongoId] = useState(null);
  const [jobMongoId, setJobMongoId] = useState("");
  const [bnNumber, setBnNumber] = useState("");
  const [referBN, setReferBN] = useState("");
  const [client, setClient] = useState("");
  const [carrier, setCarrier] = useState("");
  const [shipper, setShipper] = useState("");
  const [consignee, setConsignee] = useState("");
  const [commodity, setCommodity] = useState("");
  const [quantity, setQuantity] = useState("");
  const [weight, setWeight] = useState("");
  const [portLoading, setPortLoading] = useState("");
  const [portDischarge, setPortDischardge] = useState("");
  const [rateAEDUSD, setRateAEDUSD] = useState("3.6700");
  const [rateRUBUSD, setRateRUBUSD] = useState("");
  const [rateAEDEUR, setRateAEDEUR] = useState("");
  const [paymentTerms, setPaymentTerms] = useState("");
  const [paymentLocation, setPaymentLocation] = useState("");
  const [payerCompany, setPayerCompany] = useState("");
  const [expenses, setExpenses] = useState([]);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [currentExpense, setCurrentExpense] = useState(null);
  const [sales, setSales] = useState([]);
  const [showSaleModal, setShowSaleModal] = useState(false);
  const [currentSale, setCurrentSale] = useState(null);
  const [workers, setWorkers] = useState([]);
  const workerNameMap = useMemo(() => {
    const m = {};
    for (const w of workers) {
      const id = w.id ?? w._id;
      if (id != null) m[id] = w.name ?? String(id);
    }
    return m;
  }, [workers]);

  const [serviceDone, setServiceDone] = useState("");
  const [archived, setArchived] = useState(false);
  const isReadOnly = !!archived
  const [createdAt, setCreatedAt] = useState("");

  const { loaded } = useLoadJob(routeId, {
    setMongoId,
    setBnNumber,
    setReferBN,
    setClient,
    setCarrier,
    setShipper,
    setConsignee,
    setCommodity,
    setQuantity,
    setWeight,
    setPortLoading,
    setPortDischardge,
    setPaymentTerms,
    setPaymentLocation,
    setPayerCompany,
    setRateAEDUSD,
    setRateRUBUSD,
    setRateAEDEUR,
    setExpenses,
    setSales,
    setServiceDone,
    setArchived,
    setCreatedAt,
  });

  const fxRates = useMemo(
    () => ({
      AED_to_USD: rateAEDUSD,
      RUB_to_USD: rateRUBUSD,
      AED_to_EUR: rateAEDEUR,
    }),
    [rateAEDUSD, rateRUBUSD, rateAEDEUR]
  );

  const buildRaw = () => ({
    _id: jobMongoId,
    bnNumber, referBN, client, carrier, shipper, consignee,
    commodity, quantity, weight, portLoading, portDischarge,
    paymentTerms, paymentLocation, payerCompany,
    rateAEDUSD, rateRUBUSD, rateAEDEUR, expenses, sales,
    serviceDone, archived,
  });

  const build = buildRaw;

  // 2) Сохранение
  const saveJob = async () => {
    if (!client || (typeof client === "object" && !client.name)) {
      alert("Select client before saving");
      return;
    }

    const jobData = buildJobApiData(buildRaw(), { serviceDone, archived });
    jobData._id = jobMongoId;
    console.log("[saveJob] payload ->", jobData);

    try {
      await API.put(`/jobs/${jobMongoId}`, jobData);
      setSnapshot();
      alert("Job saved!");
    } catch (err) {
      const msg = err?.response?.data?.detail || err.message || "Unknown error";
      alert(`Save failed: ${msg}`);
      console.error(err);
    }
  };

  const { exitToDashboard, setSnapshot, isDirty } = useCloseJob(build, saveJob, jobMongoId);

  useEffect(() => {
    API.get("/workers").then((res) => setWorkers(res.data));
  }, []);

  // create job_id
  useEffect(() => {
    if (routeId) {
      setJobMongoId(routeId);
    }
  }, [routeId]);

  useEffect(() => {
    if (loaded) setSnapshot();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded]);


  const removeExpense = async (index) => {
    const expense = expenses[index];
    if (confirm("Are you sure you want to delete this expense?")) {
      try {
        if (expense._id) {
          await API.delete(`/expenses/${expense._id}`);
        }
        setExpenses(expenses.filter((_, i) => i !== index));
      } catch (err) {
        alert("Failed to delete expense");
        console.error(err);
      }
    }
  };

  const removeSale = async (index) => {
    const sale = sales[index];
    if (confirm("Are you sure you want to delete this sale?")) {
      try {
        if (sale._id) {
          await API.delete(`/sales/${sale._id}`);
        }
        setSales(sales.filter((_, i) => i !== index));
      } catch (err) {
        alert("Failed to delete sale");
        console.error(err);
      }
    }
  };

  // итоги по модалкам
  const expenseTotals = useMemo(
    () =>
      calcTotals(expenses, fxRates, { qtyKey: "quantity", unitKey: "unit_cost" }),
    [expenses, fxRates]
  );

  const saleTotals = useMemo(
    () => calcTotals(sales, fxRates, { qtyKey: "quantity", unitKey: "unit_price" }),
    [sales, fxRates]
  );

  // вывод модалок: «ненулевое/непустое число»
  const isNonZero = (v) =>
    v != null && Number.isFinite(+v) && Math.abs(+v) > 1e-9;

  // показывать ли блок итогов
  const showExpenseTotals =
    isNonZero(expenseTotals.sumAED) || isNonZero(expenseTotals.sumUSD);
  const showSaleTotals =
    isNonZero(saleTotals.sumAED) || isNonZero(saleTotals.sumUSD);

  // конверт в Excel
  const exportToExcel = async () => {
    const raw = {
      ...buildRaw(), archived
    };
    await exportJobSummaryToExcel(
      raw,
      bnNumber ? `Job_${bnNumber}.xlsx` : undefined,
      workerNameMap
    );
  };

  return (
    <div className="job-form-wrapper">
      <h2 className="end-summary" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>

        <div style={{ display: "flex", flexDirection: "column", gap: "7px" }}>
          <span style={{ fontSize: "11px", color: "pink", fontStyle: "italic", fontWeight: 400 }}>job_id: {jobMongoId || "not yet"}</span>
          {createdAt && <span className="title" style={{ fontSize: "15px", margin: 0, textAlign: "left", fontStyle: "normal", fontWeight: 600 }}>Date of issue: {createdAt}</span>}
        </div>

        <span className="title" style={{ margin: 0 }}>
          {jobMongoId && bnNumber
            ? `Job # ${bnNumber}` : "Create NEW Job"
          }
        </span>
      </h2>

      {/* Секция 1: Main Part */}
      <section className="mb-6">
        <h3 className="text-xl font-semibold mb-4">Main Part</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="row">
            <div className="floating-input-group">
              <input
                placeholder=" "
                value={bnNumber}
                onChange={(e) => setBnNumber(e.target.value)}
              />
              <label>BN Number</label>
              <fieldset aria-hidden="true"><legend><span>BN Number</span></legend></fieldset>
            </div>
            <div className="floating-input-group">
              <input
                placeholder=" "
                value={referBN}
                onChange={(e) => setReferBN(e.target.value)}
              />
              <label>Refer BN</label>
              <fieldset aria-hidden="true"><legend><span>Refer BN</span></legend></fieldset>
            </div>
          </div>

          <div className="row">
            <ClientSelect
              value={typeof client === "object" ? (client.name ?? "") : client ?? ""}
              onChange={setClient}
            />
            <ClientSelect
              value={typeof consignee === "object" ? (consignee.name ?? "") : consignee ?? ""}
              onChange={setConsignee}
              placeholder="Consignee"
            />
          </div>

          <div className="row">
            <div className="floating-input-group">
              <textarea
                rows={1}
                placeholder=" "
                value={carrier}
                onInput={(e) => {
                  e.target.style.height = "auto";
                  e.target.style.height = e.target.scrollHeight + "px";
                }}
                onChange={(e) => setCarrier(e.target.value)}
                style={{ resize: "none", overflow: "hidden" }}
              />
              <label>Carrier</label>
              <fieldset aria-hidden="true"><legend><span>Carrier</span></legend></fieldset>
            </div>

            <div className="floating-input-group">
              <textarea
                rows={1}
                placeholder=" "
                value={shipper}
                onInput={(e) => {
                  e.target.style.height = "auto";
                  e.target.style.height = e.target.scrollHeight + "px";
                }}
                onChange={(e) => setShipper(e.target.value)}
                style={{ resize: "none", overflow: "hidden" }}
              />
              <label>Shipper</label>
              <fieldset aria-hidden="true"><legend><span>Shipper</span></legend></fieldset>
            </div>
          </div>
          <div className="grid-2-1-1">
            <div className="floating-input-group">
              <input
                placeholder=" "
                value={commodity}
                onChange={(e) => setCommodity(e.target.value)}
              />
              <label>Commodity</label>
              <fieldset aria-hidden="true"><legend><span>Commodity</span></legend></fieldset>
            </div>
            <div className="floating-input-group">
              <input
                placeholder=" "
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
              <label>Quantity</label>
              <fieldset aria-hidden="true"><legend><span>Quantity</span></legend></fieldset>
            </div>
            <div className="floating-input-group">
              <input
                placeholder=" "
                value={weight}
                onChange={(e) => {
                  const val = validateNonNegativeTwoDecimals(e.target.value);
                  if (val !== null) setWeight(val);
                }}
              />
              <label>Weight</label>
              <fieldset aria-hidden="true"><legend><span>Weight</span></legend></fieldset>
            </div>
          </div>
          <div className="row">
            <div className="floating-input-group">
              <input
                placeholder=" "
                value={portLoading}
                onChange={(e) => setPortLoading(e.target.value)}
              />
              <label>Port of Loading</label>
              <fieldset aria-hidden="true"><legend><span>Port of Loading</span></legend></fieldset>
            </div>
            <div className="floating-input-group">
              <input
                placeholder=" "
                value={portDischarge}
                onChange={(e) => setPortDischardge(e.target.value)}
              />
              <label>Port of Discharge</label>
              <fieldset aria-hidden="true"><legend><span>Port of Discharge</span></legend></fieldset>
            </div>
          </div>
        </div>
      </section>

      {/* Section 2: Currency Rates */}
      <section className="mb-6">
        <h3 className="text-xl font-semibold mb-4">Currency Rates</h3>
        <div className="rates-row">
          <div className="floating-input-group">
            <input
              type="text"
              inputMode="decimal"
              placeholder=" "
              value={rateAEDUSD}
              onPaste={blockPaste}
              onKeyDown={onlyPositiveDecimal4}
              onBlur={decimal4Blur(setRateAEDUSD)}
              onChange={decimal4Change(setRateAEDUSD)}
            />
            <label>AED to USD</label>
            <fieldset aria-hidden="true"><legend><span>AED to USD</span></legend></fieldset>
          </div>
          <div className="floating-input-group">
            <input
              type="text"
              inputMode="decimal"
              placeholder=" "
              value={rateRUBUSD}
              onPaste={blockPaste}
              onKeyDown={onlyPositiveDecimal4}
              onBlur={decimal4Blur(setRateRUBUSD)}
              onChange={decimal4Change(setRateRUBUSD)}
            />
            <label>RUB to USD</label>
            <fieldset aria-hidden="true"><legend><span>RUB to USD</span></legend></fieldset>
          </div>
          <div className="floating-input-group">
            <input
              type="text"
              inputMode="decimal"
              placeholder=" "
              value={rateAEDEUR}
              onPaste={blockPaste}
              onKeyDown={onlyPositiveDecimal4}
              onBlur={decimal4Blur(setRateAEDEUR)}
              onChange={decimal4Change(setRateAEDEUR)}
            />
            <label>AED to EUR</label>
            <fieldset aria-hidden="true"><legend><span>AED to EUR</span></legend></fieldset>
          </div>
        </div>
      </section>


      {/* Section 3: Payment */}
      <section className="mb-6">
        <h3 className="text-xl font-semibold mb-4">Payment</h3>
        <div style={{ display: "flex", gap: "16px", alignItems: "stretch" }}>
          <div className="floating-input-group" style={{ flex: 1 }}>
            <input
              placeholder=" "
              value={paymentTerms}
              onChange={(e) => setPaymentTerms(e.target.value)}
            />
            <label>Payment Terms</label>
            <fieldset aria-hidden="true"><legend><span>Payment Terms</span></legend></fieldset>
          </div>
          <div className="floating-input-group" style={{ flex: 1 }}>
            <input
              placeholder=" "
              value={paymentLocation}
              onChange={(e) => setPaymentLocation(e.target.value)}
            />
            <label>Payment Location</label>
            <fieldset aria-hidden="true"><legend><span>Payment Location</span></legend></fieldset>
          </div>
          <div style={{ flex: 1 }}>
            <ClientSelect
              placeholder="Payer Company"
              value={
                typeof payerCompany === "object" ? payerCompany.name ?? "" : payerCompany ?? ""
              }
              onChange={setPayerCompany}
            />
          </div>
        </div>
      </section>

      {/* Expenses */}
      <section className="mb-6">
        <h3 className="text-xl font-semibold mb-2">Expenses</h3>

        <TransactionHeader isExpense={true} />

        <div className="expenses-cards">
          {expenses.map((expense, i) => {
            const quantity = Number(expense.quantity ?? expense.quantity ?? 0);
            const unit = Number(expense.unit_cost ?? 0);
            const amount = Number.isFinite(quantity * unit) ? quantity * unit : 0;
            const currency = expense.currency || expense.currency_origin || "";
            const amountAED = toAED(amount, currency, fxRates);

            return (
              <div className="expense-card-row" key={i}>
                <span className="ex-cell num">{i + 1}</span>
                <span className="ex-cell desc">{expense.description || "—"}</span>
                <span className="ex-cell">{quantity}</span>
                <span className="ex-cell">{formatTableNumber(unit)}</span>
                <span className="ex-cell">{formatTableNumber(amount)}</span>
                <span className="ex-cell">{currency}</span>
                <span className="ex-cell">{formatTableNumber(amountAED)}</span>
                <span className="ex-cell">{expense.seller || "—"}</span>
                <span className="ex-cell">
                  {expense.worker ? workerNameMap[expense.worker] ?? expense.worker : "—"}
                </span>

                <div className="ex-actions-col">
                  <button
                    type="button"
                    className="ex-action-btn"
                    title="Edit"
                    onClick={() => {
                      setCurrentExpense(i);
                      setShowExpenseModal(true);
                    }}
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    type="button"
                    className="ex-action-btn danger"
                    title="Delete"
                    onClick={() => removeExpense(i)}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="exp-toolbar">
          {showExpenseTotals && (
            <div className="totals">
              {isNonZero(expenseTotals.sumAED) && (
                <span>Amount in AED: {formatTableNumber(expenseTotals.sumAED)}</span>
              )}
              {isNonZero(expenseTotals.sumUSD) && (
                <span>Amount in USD: {formatTableNumber(expenseTotals.sumUSD)}</span>
              )}
            </div>
          )}

          <button
            type="button"
            disabled={!jobMongoId || sales.length === 0}
            title={sales.length === 0 ? "You must add at least one Sale first" : undefined}
            onClick={() => {
              setCurrentExpense(null);
              setShowExpenseModal(true);
            }}
            className="bn-btn"
          >
            <Plus size={18} /> Add Expense
          </button>
        </div>
      </section>

      {/* Sales */}
      <section className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Sales</h3>

        <TransactionHeader isExpense={false} />

        <div className="expenses-cards">
          {sales.map((sale, i) => {
            const quantity = Number(sale.quantity ?? 0);
            const unit = Number(sale.unit_price ?? 0);
            const amount = Number.isFinite(quantity * unit) ? quantity * unit : 0;
            const currency = sale.currency || "USD";
            const amountAED = toAED(amount, currency, fxRates);

            return (
              <div className="expense-card-row" key={i}>
                <span className="ex-cell num">{i + 1}</span>
                <span className="ex-cell desc">{sale.description || "—"}</span>
                <span className="ex-cell">{quantity}</span>
                <span className="ex-cell">{formatTableNumber(unit)}</span>
                <span className="ex-cell">{formatTableNumber(amount)}</span>
                <span className="ex-cell">{currency}</span>
                <span className="ex-cell">{formatTableNumber(amountAED)}</span>
                <span className="ex-cell">
                  {sale.coworker_id ? workerNameMap[sale.coworker_id] ?? sale.coworker_name ?? "—" : "—"}
                </span>
                <span className="ex-cell">
                  {sale.worker ? workerNameMap[sale.worker] ?? sale.worker : "—"}
                </span>

                <div className="ex-actions-col">
                  <button
                    type="button"
                    className="ex-action-btn"
                    title="Edit"
                    onClick={() => {
                      setCurrentSale(i);
                      setShowSaleModal(true);
                    }}
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    type="button"
                    className="ex-action-btn danger"
                    title="Delete"
                    onClick={() => removeSale(i)}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="exp-toolbar">
          {showSaleTotals && (
            <div className="totals">
              {isNonZero(saleTotals.sumAED) && (
                <span>Amount in AED: {formatTableNumber(saleTotals.sumAED)}</span>
              )}
              {isNonZero(saleTotals.sumUSD) && (
                <span>Amount in USD: {formatTableNumber(saleTotals.sumUSD)}</span>
              )}
            </div>
          )}

          <button
            type="button"
            onClick={() => {
              setCurrentSale(null);
              setShowSaleModal(true);
            }}
            className="bn-btn"
          >
            <Plus size={18} /> Add Sale
          </button>
        </div>
      </section>

      {/* выводы */}
      <EndSummary
        expenses={expenses}
        sales={sales}
        fxRates={{
          AED_to_USD: rateAEDUSD,
          RUB_to_USD: rateRUBUSD,
          AED_to_EUR: rateAEDEUR,
        }}
        workerNameMap={workerNameMap}
      />

      {/* Docs */}
      <DocSection jobId={jobMongoId} />

      {/* Buttons */}
      <div className="job-actions">
        <div className="actions-left">
          <button onClick={saveJob} className="bn-btn bn-btn--accent">
            <Save size={18} /> Save
          </button>

          <button type="button" onClick={async () => {
            await exitToDashboard();
          }} className="bn-btn bn-btn--muted">
            Close & return to Dashboard
          </button>

          {loaded && (
            <>
              <button type="button" onClick={async () => {
                if (!jobMongoId) return;
                if (confirm("Are you SURE you want to delete this job?")) {
                  try {
                    await API.delete(`/jobs/${jobMongoId}`);
                    alert("Job deleted!");
                    exitToDashboard();
                  } catch (err) {
                    const msg = err?.response?.data?.detail || err.message || "Delete failed";
                    alert(msg);
                    console.error(err);
                  }
                }
              }}
                className="bn-btn bn-btn--danger"
              >
                Delete Job
              </button>

              <button type="button" onClick={exportToExcel} className="bn-btn bn-btn--muted">
                Export to Excel
              </button>
            </>
          )}
        </div>

        {/* дата & тумблер */}
        <div className="toggles">

          <label className="s-date">
            <span>Service done</span>
            <input type="date"
              value={serviceDone ? ddmmyyyyToISO(serviceDone) : ""}
              onChange={(e) => setServiceDone(isoToDDMMYYYY(e.target.value))}
              disabled={isReadOnly}
              onKeyDown={(e) => {
                // Позволяет быстро очистить дату при нажатии Delete
                if (e.key === "Delete") {
                  setServiceDone("");
                }
              }}
            />
          </label>

          <label className="toggle">
            <input type="checkbox" checked={archived} onChange={(e) => setArchived(e.target.checked)} />
            <span>Archive (lock editing)</span>
          </label>
        </div>
      </div>

      {/* Рендер модалок */}
      {showExpenseModal && (
        <AddExpenseModal
          isOpen={true}
          jobId={routeId}
          sales={sales}
          onClose={() => setShowExpenseModal(false)}
          onSave={(newExpense) => {
            if (currentExpense !== null) {
              const updated = [...expenses];
              updated[currentExpense] = newExpense;
              setExpenses(updated);
            } else {
              setExpenses([...expenses, newExpense]);
            }
            setShowExpenseModal(false);
          }}
          workers={workers}
          existingData={currentExpense !== null ? expenses[currentExpense] : {}}
          displayNo={currentExpense !== null ? currentExpense + 1 : expenses.length + 1}
          rates={fxRates}
        />
      )}

      {showSaleModal && (
        <AddSaleModal
          isOpen={true}
          onClose={() => setShowSaleModal(false)}
          onSave={(newSale) => {
            if (currentSale !== null) {
              const updated = [...sales];
              updated[currentSale] = newSale;
              setSales(updated);
            } else {
              setSales([...sales, newSale]);
            }
            setShowSaleModal(false);
          }}
          jobId={jobMongoId}
          allowLocalOnly={!jobMongoId}
          workers={workers}
          existingData={currentSale !== null ? sales[currentSale] : {}}
          displayNo={currentSale !== null ? currentSale + 1 : sales.length + 1}
          rates={fxRates}
        />
      )}
    </div>
  );
}
