import { useState, useEffect } from "react";
import { Plus, Save } from "lucide-react";
import API from "../api";
import ExpenseBlock from "../components/ExpenseBlock";
import SaleBlock from "../components/SaleBlock";
import ModalAddWorker from "../components/ModalAddWorker";
import FileUpload from "../components/FileUpload";


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
    const [portDischerge, setPortDischardge] = useState("");
    const [rateAEDUSD, setRateAEDUSD] = useState(0);
    const [rateRUBUSD, setRateRUBUSD] = useState(0);
    const [rateAEDEUR, setRateAEDEUR] = useState(0);
    const [paymentTerms, setPaymentTerms] = useState("");
    const [paymentLocation, setPaymentLocation] = useState("");
    const [payerCompany, setPayerCompany] = useState("");
    const [expenses, setExpenses] = useState([]);
    const [sales, setSales] = useState("");
    const [workers, setWorkers] = useState([]);
    const [showWorkerModal, setShowWorkerModal] = useState(false);
    const [files, setFiles] = useState([]);

    useEffect(() => {
        API.get("/workers").then((res) => setWorkers(res.data));
    }, []);

    const addExpense = () => setExpenses([...expenses, { description: "", const: { USD: 0 }, worker: ""}]);
    const addSale = () => setSales([...sales, { description: "", const: { USD: 0 }, worker: ""}]);

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

    const handleFileUpload = (newFiles) => setFiles([...files, ...newFiles]);

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
                port_discharge: portDischerge,
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
        <div className="max-w-5xl mx-auto p-6 bg-gray-800 rounded-xl shadow-lg text-white">
            <h2 className="text-3xl font-bold mb-6">Create NEW Job</h2>

            {/* Секция 1: Main Part */}
            <section className="mb-6">
                <h3 className="text-xl font-semibold mb-4">Main Part</h3>
                <div className="grid grid-cols-2 gap-4">
                    <input className="bg-gray-700 p-2 rounded" placeholder="Job ID" value={jobId} inChange={(e) => setJobId(e.target.value)} />
                    <input className="bg-gray-700 p-2 rounded" placeholder="BN Number" value={bnNumber} inChange={(e) => setBnNumber(e.target.value)} />
                    <input className="bg-gray-700 p-2 rounded" placeholder="Refer BN" value={referBN} inChange={(e) => setReferBN(e.target.value)} />
                    <input className="bg-gray-700 p-2 rounded" placeholder="Client" value={client} inChange={(e) => setClient(e.target.value)} />
                    <input className="bg-gray-700 p-2 rounded" placeholder="Carrier" value={carrier} inChange={(e) => setCarrier(e.target.value)} />
                    <input className="bg-gray-700 p-2 rounded" placeholder="Shipper" value={shipper} inChange={(e) => setShipper(e.target.value)} />
                    <input className="bg-gray-700 p-2 rounded" placeholder="Consignee" value={consignee} inChange={(e) => setConsignee(e.target.value)} />
                    <input className="bg-gray-700 p-2 rounded" placeholder="Commodity" value={commodity} inChange={(e) => setCommodity(e.target.value)} />
                    <input className="bg-gray-700 p-2 rounded" placeholder="Quantity" value={quantity} inChange={(e) => setQuantity(e.target.value)} />
                    <input className="bg-gray-700 p-2 rounded" placeholder="Weight" value={weight} inChange={(e) => setWeight(e.target.value)} />
                    <input className="bg-gray-700 p-2 rounded" placeholder="Port of Loading" value={portLoading} inChange={(e) => setPortLoading(e.target.value)} />
                    <input className="bg-gray-700 p-2 rounded" placeholder="Port of Discharge" value={portDischerge} inChange={(e) => setPortDischardge(e.target.value)} />
                </div>
            </section>

            {/* Section 2: Currency Rates */}
            <section className="mb-6">
                <h3 className="text-xl font-semibold mb-4">Currency Rates</h3>
                <div className="grid grid-cols-3 gap-4">
                    <input className="bg-gray-700 p-2 rounded" placeholder="AED to USD" type="number" value={rateAEDUSD} onChange={(e) => setRateAEDUSD(parseFloat(e.target.value))} />
                    <input className="bg-gray-700 p-2 rounded" placeholder="RUB to USD" type="number" value={rateRUBUSD} onChange={(e) => setRateRUBUSD(parseFloat(e.target.value))} />
                    <input className="bg-gray-700 p-2 rounded" placeholder="AED to EUR" type="number" value={rateAEDEUR} onChange={(e) => setRateAEDEUR(parseFloat(e.target.value))} />
                </div>
            </section>

            {/* Section 3: Payment */}
            <section className="mb-6">
                <h3 className="text-xl font-semibold mb-4">Payment</h3>
                <div className="grid grid-cols-3 gap-4">
                    <input className="bg-gray-700 p-2 rounded" placeholder="Payment Terms" value={paymentTerms} inChange={(e) => setPaymentTerms(e.target.value)} />
                    <input className="bg-gray-700 p-2 rounded" placeholder="Payment Location" value={paymentLocation} inChange={(e) => setPaymentLocation(e.target.value)} />
                    <input className="bg-gray-700 p-2 rounded" placeholder="Payer Company" value={payerCompany} inChange={(e) => setPayerCompany(e.target.value)} />
                </div>
            </section>



            {/* Expenses */}
            <section className="mb-6">
                <h3 className="text-xl font-semibold mb-2">Expenses</h3>
                {expenses.map((expenses, index) => (
                    <ExpenseBlock
                        key={index}
                        expense={expense}
                        index={index}
                        onChange={handleExpenseChange}
                        onRemove={removeExpense}
                        workers={workers}
                        onAddWorker={() => setShowWorkerModal(true)}
                    />
                ))}
                <button
                    onClick={addExpense}
                    className="flex items-center gap-2 bg-green-600 px-4 py-2 rounded-lg text-white hover:bg-green-700 transform hover:scale-105 transition"
                >
                <Plus size={18} /> Add Expense
                </button>
            </section>


            {/* Sales */}
            <section className="mb-6">
                <h3 className="text-lg font-semibold mb-2">Sale</h3>
                {sales.map((sale, index) => (
                    <SaleBlock
                        key={index}
                        sale={sale}
                        index={index}
                        onChange={handleSaleChange}
                        onRemove={removeSale}
                        workers={workers}
                        onAddWorker={() => setShowWorkerModal(true)}
                    />    
                ))}
                <button
                    onClick={addSale}
                    className="flex items-center gap-2 bg-purple-600 px-4 py-2 rounded-lg text-white hover:bg-purple-700 transform hover:scale-105 transition"
                >
                <Plus size={18} /> Add Sale
                </button>
            </section>


            {/* File Upload */}
            <FileUpload onFilesAdded={handleFileUpload} />


            {/* Buttons */}
            <div className="flex gap-4 mt-6">
                <button
                    onClick={saveJob}
                    className="flex items-center gap-2 bg-blue-600 px-4 py-2 rounded-lg hover:bg-blue-700 transform hover:scale-105 transition"
                >
                <Save size={18} /> Save
                </button>

                <button
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

                <button
                onClick={async () => {
                    await API.patch(`/jobs/${jobId}/close`);
                    alert("Job is close.");
                }}
                className="flex items-center gap-2 bg-gray-600 px-4 py-2 rounded-lg hover:bg-gray-700 transform hover:scale-105 transition"
                >
                    Close the Job
                </button>
            </div>
            
            {showWorkerModal && (
                <ModalAddWorker
                    onClose={() => setShowWorkerModal(false)}
                    onAddWorker={handleAddWorker}
                />
            )}
        </div>
    );
}