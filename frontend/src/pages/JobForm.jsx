import { useState, useEffect, useMemo } from "react";
import { useParams } from "react-router-dom";
import { Plus, Save, Edit2, Trash2 } from "lucide-react";
import { toAED } from "../utils/currency";
import API from "../api";
import { format4 } from "../utils/numberFormat";
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
 
  const [serviceDone, setServiceDone] = useState(); //DD-MM-YYYY
  const [archived, setArchived] = useState(false); 
  const isReadOnly = !!archived

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
    bnNumber, referBN, client, carrier, shipper, consignee,
    commodity, quantity, weight, portLoading, portDischarge,
    paymentTerms, paymentLocation, payerCompany,
    rateAEDUSD, rateRUBUSD, rateAEDEUR, expenses, sales, serviceDone,
  });

  const build = buildRaw;

  // 2) Сохранение
  const saveJob = async () => {
    if (!client || (typeof client === "object" && !client.name)) {
      alert("Select client before saving");
      return;
    }

    const wasNew = !jobMongoId;
    const jobData = buildJobApiData(buildRaw(), { serviceDone, archived });

    try {
      if (wasNew) {
        const { data } = await API.post("/jobs/", jobData);
        setJobMongoId(data?._id || "");
      } else {
        await API.put(`/jobs/${jobMongoId}`, jobData);
      }

      setSnapshot();

      alert("Congrats! Job saved.");

      if (wasNew) {
        await exitToDashboard();
      }
    } catch (err) {
      const msg = err?.response?.data?.detail || err.message || "Unknown error";
      alert(`Save failed: ${msg}`);
      console.error(err);
    }
  };

  const { exitToDashboard, setSnapshot } = useCloseJob(build, saveJob, jobMongoId);

  useEffect(() => {
    API.get("/workers").then((res) => setWorkers(res.data));
  }, []);

  useEffect(() => {
    if (routeId && routeId !== "new") setJobMongoId(routeId);
  }, [routeId]);

  useEffect(() => {
    if (loaded) setSnapshot();
  }, [loaded, setSnapshot]);


  const removeExpense = (index) =>
    setExpenses(expenses.filter((_, i) => i !== index));
  const removeSale = (index) => setSales(sales.filter((_, i) => i !== index));

  // итоги по модалкам
  const expenseTotals = useMemo(
    () =>
      calcTotals(expenses, fxRates, { qtyKey: "quantity", unitKey: "unit_cost" }),
    [expenses, fxRates]
  );

  const saleTotals = useMemo(
    () => calcTotals(sales, fxRates, { qtyKey: "qty", unitKey: "unit_price" }),
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
      ...buildRaw(), archived };
    await exportJobSummaryToExcel(
      raw,
      bnNumber ? `Job_${bnNumber}.xlsx` : undefined
    );
  };

  return (
    <div className="job-form-wrapper">
      <h2 className="end-summary">
        <span className="title">
          {routeId && routeId !== "new" ? `Job  # ${bnNumber || "-"}` : "Create NEW Job"}
        </span>
      </h2>

      {/* Секция 1: Main Part */}
      <section className="mb-6">
        <h3 className="text-xl font-semibold mb-4">Main Part</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="row">
            <input
              className="bg-gray-700 p-2 rounded"
              placeholder="BN Number"
              value={bnNumber}
              onChange={(e) => setBnNumber(e.target.value)}
            />
            <input
              className="bg-gray-700 p-2 rounded"
              placeholder="Refer BN"
              value={referBN}
              onChange={(e) => setReferBN(e.target.value)}
            />
          </div>

          <ClientSelect
            value={typeof client === "object" ? (client.name ?? "") : client ?? ""}
            onChange={setClient}
          />

          <input
            className="bg-gray-700 p-2 rounded"
            placeholder="Carrier"
            value={carrier}
            onChange={(e) => setCarrier(e.target.value)}
          />
          <input
            className="bg-gray-700 p-2 rounded"
            placeholder="Shipper"
            value={shipper}
            onChange={(e) => setShipper(e.target.value)}
          />
          <ClientSelect
            value={typeof consignee === "object" ? (consignee.name ?? "") : consignee ?? ""}
            onChange={setConsignee}
            placeholder="Consignee"
          />
          <div className="grid-2-1-1">
            <input
              className="bg-gray-700 p-2 rounded"
              placeholder="Commodity"
              value={commodity}
              onChange={(e) => setCommodity(e.target.value)}
            />
            <input
              className="bg-gray-700 p-2 rounded"
              placeholder="Quantity"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
            />
            <input
              className="bg-gray-700 p-2 rounded"
              placeholder="Weight"
              value={weight}
              onChange={(e) => {
                const val = validateNonNegativeTwoDecimals(e.target.value);
                if (val !== null) setWeight(val);
              }}
            />
          </div>
          <div className="row">
            <input
              className="bg-gray-700 p-2 rounded"
              placeholder="Port of Loading"
              value={portLoading}
              onChange={(e) => setPortLoading(e.target.value)}
            />
            <input
              className="bg-gray-700 p-2 rounded"
              placeholder="Port of Discharge"
              value={portDischarge}
              onChange={(e) => setPortDischardge(e.target.value)}
            />
          </div>
        </div>
      </section>

      {/* Section 2: Currency Rates */}
      <section className="mb-6">
        <h3 className="text-xl font-semibold mb-4">Currency Rates</h3>
        <div className="rates-row">
          <label>
            AED to USD:
            <input
              type="text"
              inputMode="decimal"
              pattern="^\\d+(\\.\\d{0,4})?$"
              placeholder="AED to USD"
              value={rateAEDUSD}
              onPaste={blockPaste}
              onKeyDown={onlyPositiveDecimal4}
              onBlur={decimal4Blur(setRateAEDUSD)}
              onChange={decimal4Change(setRateAEDUSD)}
            />
          </label>
          <label>
            RUB to USD:
            <input
              type="text"
              inputMode="decimal"
              pattern="^\\d+(\\.\\d{0,4})?$"
              placeholder="RUB to USD"
              value={rateRUBUSD}
              onPaste={blockPaste}
              onKeyDown={onlyPositiveDecimal4}
              onBlur={decimal4Blur(setRateRUBUSD)}
              onChange={decimal4Change(setRateRUBUSD)}
            />
          </label>
          <label>
            AED to EUR:
            <input
              type="text"
              inputMode="decimal"
              pattern="^\\d+(\\.\\d{0,4})?$"
              placeholder="AED to EUR"
              value={rateAEDEUR}
              onPaste={blockPaste}
              onKeyDown={onlyPositiveDecimal4}
              onBlur={decimal4Blur(setRateAEDEUR)}
              onChange={decimal4Change(setRateAEDEUR)}
            />
          </label>
        </div>
      </section>

      {/* Section 3: Payment */}
      <section className="mb-6">
        <h3 className="text-xl font-semibold mb-4">Payment</h3>
        <div className="grid grid-cols-3 gap-4">
          <input
            className="bg-gray-700 p-2 rounded"
            placeholder="Payment Terms"
            value={paymentTerms}
            onChange={(e) => setPaymentTerms(e.target.value)}
          />
          <input
            className="bg-gray-700 p-2 rounded"
            placeholder="Payment Location"
            value={paymentLocation}
            onChange={(e) => setPaymentLocation(e.target.value)}
          />
          <ClientSelect
            placeholder="Payer Company"
            value={
              typeof payerCompany === "object" ? payerCompany.name ?? "" : payerCompany ?? ""
            }
            onChange={setPayerCompany}
          />
        </div>
      </section>

      {/* Expenses */}
      <section className="mb-6">
        <h3 className="text-xl font-semibold mb-2">Expenses</h3>

        <TransactionHeader isExpense={true} />

        <div className="expenses-cards">
          {expenses.map((expense, i) => {
            const qty = Number(expense.quantity ?? expense.qty ?? 0);
            const unit = Number(expense.unit_cost ?? 0);
            const amount = Number.isFinite(qty * unit) ? qty * unit : 0;
            const currency = expense.currency || "USD";
            const amountAED = toAED(amount, currency, fxRates);

            return (
              <div className="expense-card-row" key={i}>
                <span className="ex-cell num">{i + 1}</span>
                <span className="ex-cell desc">{expense.description || "—"}</span>
                <span className="ex-cell">{qty}</span>
                <span className="ex-cell">{format4(unit)}</span>
                <span className="ex-cell">{format4(amount)}</span>
                <span className="ex-cell">{currency}</span>
                <span className="ex-cell">{format4(amountAED)}</span>
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
                <span>Amount in AED: {format4(expenseTotals.sumAED)}</span>
              )}
              {isNonZero(expenseTotals.sumUSD) && (
                <span>Amount in USD: {format4(expenseTotals.sumUSD)}</span>
              )}
            </div>
          )}

          <button
            type="button"
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
            const qty = Number(sale.qty ?? 0);
            const unit = Number(sale.unit_price ?? 0);
            const amount = Number.isFinite(qty * unit) ? qty * unit : 0;
            const currency = sale.currency || "USD";
            const amountAED = toAED(amount, currency, fxRates);

            return (
              <div className="expense-card-row" key={i}>
                <span className="ex-cell num">{i + 1}</span>
                <span className="ex-cell desc">{sale.description || "—"}</span>
                <span className="ex-cell">{qty}</span>
                <span className="ex-cell">{format4(unit)}</span>
                <span className="ex-cell">{format4(amount)}</span>
                <span className="ex-cell">{currency}</span>
                <span className="ex-cell">{format4(amountAED)}</span>
                <span className="ex-cell"></span>
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
                <span>Amount in AED: {format4(saleTotals.sumAED)}</span>
              )}
              {isNonZero(saleTotals.sumUSD) && (
                <span>Amount in USD: {format4(saleTotals.sumUSD)}</span>
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
        {!jobMongoId ? (
          // NEW BN
          <div className="actions-left">
            <button onClick={saveJob} className="bn-btn bn-btn--accent">
              <Save size={18} /> Save
            </button>

            <button type="button" onClick={exitToDashboard} className="bn-btn bn-btn--muted">
              Close & return to Dashboard
            </button>
          </div>
        ) : (
          <>
          {/* existed BN */}
          {/* buttons _left */}
          <div className="actions-left">
            <button type="button" onClick={exitToDashboard} className="bn-btn bn-btn--muted">
              Close & return to Dashboard
            </button>

            <button type="button" onClick={async () => {
              if (!jobMongoId) return;
              if (confirm("BROTIK, Are you SURE?")) {
                try {
                  await API.delete(`/jobs/${jobMongoId}`);
                  alert("Job have deleted!");
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
          </div>

          {/* дата & тумблер */}
          <div className="toggles">

            <label className="s-date">
              <span>Service done</span>
              <input type="date"
              value={ddmmyyyyToISO(serviceDone)}
              onChange={(e) => setServiceDone(isoToDDMMYYYY(e.target.value))}
              disabled={isReadOnly}
              />
            </label>

            <label className="toggle">
              <input type="checkbox" checked={archived} onChange={(e) => setArchived(e.target.checked)} />
              <span>Archive (lock editing)</span>
            </label>
          </div>
        </>  
        )}
      </div>

      {/* Рендер модалок */}
      {showExpenseModal && (
        <AddExpenseModal
          isOpen={true}
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
          sales={sales}
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
          workers={workers}
          existingData={currentSale !== null ? sales[currentSale] : {}}
          displayNo={currentSale !== null ? currentSale + 1 : sales.length + 1}
          rates={fxRates}
        />
      )}
    </div>
  );
}
