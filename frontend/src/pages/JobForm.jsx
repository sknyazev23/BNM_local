import { useState, useEffect, useMemo } from "react";
import { Plus, Save, Edit2, Trash2 } from "lucide-react";
import { toAED } from "../utils/currency";
import API from "../api";
import { format4 } from "../utils/numberFormat";
import ClientSelect from "../components/ClientSelect";


import FileUpload from "../components/FileUpload";
import AddExpenseModal from "../components/AddExpenseModal";
import AddSaleModal from "../components/AddSaleModal";
import TransactionHeader from "../components/TransactionHeader";
import { validateNonNegativeTwoDecimals, onlyPositiveDecimal4, blockPaste, decimal4Blur, decimal4Change } from "../utils/numberValidation";
import "../styles/job.css";


export default function JobForm() {
    const [jobId, setJobId] = useState("");
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
    const [showWorkerModal, setShowWorkerModal] = useState(false);
    

    useEffect(() => {
        API.get("/workers").then((res) => setWorkers(res.data));
    }, []);

    const addExpense = () => setExpenses([...expenses, { description: "", cost: { USD: 0 }, worker: ""}]);
    const addSale = () => setSales([...sales, { description: "", cost: { USD: 0 }, worker: ""}]);

    const handleExpenseChange = (index, field, value) => {
        const updated = [...expenses];
        updated[index][field] = value;
        setExpenses(updated);
    };

    const handleSaleChange = (index, field, value) => {
        const updated = [...sales];
        updated[index][field] = value;
        setSales(updated);
    };

    const removeExpense = (index) => setExpenses(expenses.filter((_, i) => i !== index));
    const removeSale = (index) => setSales(sales.filter((_, i) => i !== index));

    const handleAddWorker = (newWorker) => {
        setWorkers([...workers, newWorker]);
        setShowWorkerModal(false);
    };


    const saveJob = async () => {
        const jobData = {
            job_id: jobId,
            main_part: {
                bn_number: bnNumber,
                refer_bn: referBN,
                client,
                carrier,
                shipper,
                consignee,
                commodity,
                quantity,
                weight,
                port_loading: portLoading,
                port_discharge: portDischarge,
                rates: {
                    AED_to_USD: rateAEDUSD,
                    RUB_to_USD: rateRUBUSD,
                    AED_to_EUR: rateAEDEUR,
                },
                payment_terms: paymentTerms,
                payment_location: paymentLocation,
                payer_company: payerCompany,
            },
            expenses_part: expenses,
            sale_part: sales,
        };
        await API.post("/jobs", jobData);
        alert("Congrats! Job saved.");
    };

    return (
        <div className="job-form-wrapper">
            <h2 className="job-title text-3xl font-bold mb-6">Create NEW Job</h2>

            {/* Секция 1: Main Part */}
            <section className="mb-6">
                <h3 className="text-xl font-semibold mb-4">Main Part</h3>
                <div className="grid grid-cols-2 gap-4">
                    <input className="bg-gray-700 p-2 rounded" placeholder="Job ID" value={jobId} onChange={(e) => setJobId(e.target.value)} />
                    <input className="bg-gray-700 p-2 rounded" placeholder="BN Number" value={bnNumber} onChange={(e) => setBnNumber(e.target.value)} />
                    <input className="bg-gray-700 p-2 rounded" placeholder="Refer BN" value={referBN} onChange={(e) => setReferBN(e.target.value)} />
                    
                    <ClientSelect value={client} onChange={setClient} />
                    <input className="bg-gray-700 p-2 rounded" placeholder="Carrier" value={carrier} onChange={(e) => setCarrier(e.target.value)} />
                    <input className="bg-gray-700 p-2 rounded" placeholder="Shipper" value={shipper} onChange={(e) => setShipper(e.target.value)} />
                    <input className="bg-gray-700 p-2 rounded" placeholder="Consignee" value={consignee} onChange={(e) => setConsignee(e.target.value)} />
                    <input className="bg-gray-700 p-2 rounded" placeholder="Commodity" value={commodity} onChange={(e) => setCommodity(e.target.value)} />
                    <input className="bg-gray-700 p-2 rounded" placeholder="Quantity" value={quantity} onChange={(e) =>  setQuantity(e.target.value)} />
                    <input className="bg-gray-700 p-2 rounded" placeholder="Weight" value={weight} onChange={(e) => {
                        const val = validateNonNegativeTwoDecimals(e.target.value);
                        if (val !== null) setWeight(val);
                        }}
                    />
                    <input className="bg-gray-700 p-2 rounded" placeholder="Port of Loading" value={portLoading} onChange={(e) => setPortLoading(e.target.value)} />
                    <input className="bg-gray-700 p-2 rounded" placeholder="Port of Discharge" value={portDischarge} onChange={(e) => setPortDischardge(e.target.value)} />
                </div>
            </section>

            {/* Section 2: Currency Rates */}
            <section className="mb-6">
                    <h3 className="text-xl font-semibold mb-4">Currency Rates</h3>
                    <div className="rates-row">
                        <label>
                            AED to USD:
                            <input
                                type="text" inputMode="decimal" pattern="^\\d+(\\.\\d{0,4}}?$"
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
                                type="text" inputMode="decimal" pattern="^\\d+(\\.\\d{0,4}}?$"
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
                                type="text" inputMode="decimal" pattern="^\\d+(\\.\\d{0,4}}?$"
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
                    <input className="bg-gray-700 p-2 rounded" placeholder="Payment Terms" value={paymentTerms} onChange={(e) => setPaymentTerms(e.target.value)} />
                    <input className="bg-gray-700 p-2 rounded" placeholder="Payment Location" value={paymentLocation} onChange={(e) => setPaymentLocation(e.target.value)} />
                    <ClientSelect placeholder="Payer Company" value={payerCompany} onChange={setPayerCompany} />
                </div>
            </section>


            {/* Expenses */}
            <section className="mb-6">
               <h3 className="text-xl font-semibold mb-2">Expenses</h3>

                <TransactionHeader isExpense={true} />

                <div className="expenses-cards">

                {expenses.map((expense, i) => {
                    const qty  = Number(expense.quantity ?? expense.qty ?? 0);
                    const unit = Number(expense.unit_cost ?? 0);
                    const amount = Number.isFinite(qty * unit) ? qty * unit : 0;
                    const currency = expense.currency || "USD";
                    const amountAED = toAED(amount, currency, {
                        AED_to_USD: rateAEDUSD,
                        RUB_to_USD: rateRUBUSD,
                        AED_to_EUR: rateAEDEUR,
                    });

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
                            {expense.worker ? (workerNameMap[expense.worker] ?? expense.worker) : "—"}</span>

                        <div className="ex-actions-col">
                            <button
                                type="button"
                                className="ex-action-btn"
                                title="Edit"
                                onClick={() => { setCurrentExpense(i); setShowExpenseModal(true); }}
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

                <button
                    type="button"
                    onClick={() => { setCurrentExpense(null); setShowExpenseModal(true); }}
                    className="bn-btn"
                >
                    <Plus size={18} /> Add Expense
                </button>


            </section>


            {/* Sales */}
            <section className="mb-6">
                <h3 className="text-lg font-semibold mb-2">Sales</h3>

                <TransactionHeader isExpense={false} />

                <div className="expenses-cards">
                    {sales.map((sale, i) => {
                    const qty    = Number(sale.qty ?? 0);
                    const unit   = Number(sale.unit_price ?? 0);
                    const amount = Number.isFinite(qty * unit) ? qty * unit : 0;
                    const currency = sale.currency || "USD";
                    const amountAED = toAED(amount, currency, {
                        AED_to_USD: rateAEDUSD,
                        RUB_to_USD: rateRUBUSD,
                        AED_to_EUR: rateAEDEUR,
                    });

                    return (
                        <div className="expense-card-row" key={i}>
                        <span className="ex-cell num">{i + 1}</span>
                        <span className="ex-cell desc">{sale.description || "—"}</span>
                        <span className="ex-cell">{qty}</span>
                        <span className="ex-cell">{format4(unit)}</span>
                        <span className="ex-cell">{format4(amount)}</span>
                        <span className="ex-cell">{currency}</span>
                        <span className="ex-cell">{format4(amountAED)}</span>
                        <span className="ex-cell">—</span>
                        <span className="ex-cell">
                            {sale.worker ? (workerNameMap[sale.worker] ?? sale.worker) : "—"}
                        </span>

                        <div className="ex-actions-col">
                            <button
                            type="button"
                            className="ex-action-btn"
                            title="Edit"
                            onClick={() => { setCurrentSale(i); setShowSaleModal(true); }}
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

                <button
                    type="button"
                    onClick={() => { setCurrentSale(null); setShowSaleModal(true); }}
                    className="bn-btn"
                >
                    <Plus size={18} /> Add Sale
                </button>
            </section>


            {/* File Upload */}
            {jobId && (
                <section className="mb-6">
                    <h3 className="text-xl font-semibold mb-2">Documents</h3>
                    <FileUpload jobId={jobId} />
                </section>
            )}



            {/* Buttons */}
            <div className="flex gap-4 mt-6">
                <button
                    onClick={saveJob}
                    className="flex items-center gap-2 bg-blue-600 px-4 py-2 rounded-lg hover:bg-blue-700 transform hover:scale-105 transition"
                >
                <Save size={18} /> Save
                </button>

                <button type="button"
                onClick={async () => {
                    if (confirm("BROTIK, Are you SURE?")) {
                        await API.delete(`/jobs/${jobId}`);
                        alert("Job have deleted!");
                    }
                }}
                className="flex items-center gap-2 bg-red-600 px-4 rounded-lg hiver:bg-red-700 transform hover:scale-105 transition"
                >
                    Delete Job
                </button>

                <button type="button"
                onClick={async () => {
                    await API.patch(`/jobs/${jobId}/close`);
                    alert("Job is close.");
                }}
                className="flex items-center gap-2 bg-gray-600 px-4 py-2 rounded-lg hover:bg-gray-700 transform hover:scale-105 transition"
                >
                    Close the Job
                </button>
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
            />
            
            )}

        </div>
    );
}