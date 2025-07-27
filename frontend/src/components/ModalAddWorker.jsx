import { useState } from "react";
import API from "../api";


export default function ModalAddWoreker({ onClose, onAddWorker }) {
    const [name, setName] = useState("");
    const [role, setRole] = useState("");
    const [mail, setMail] = useState("");
    const [percent, setPercent] = useState("");

    const handleSave = async () => {
        const newWorker = {
            id: `W${Date.now()}`,
            name,
            role,
            mail,
            percent_rate: percent ? parseFloat(percent) : null,
        };
        await API.post("/workers", newWorker);
        onAddWorker(newWorker);
    };

    return (
        <div className="fexed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-gray-800 p-6 rounded-xl shadow-lg w-96">
                <h2 className="text-xl mb-4">New Worker</h2>
                <input className="bg-gray-700 w-full p-2 rounded mb-2" placeholder="Name * " value={name} onChange={(e) => setName(e.target.value)} />
                <input className="bg-gray-700 w-full p-2 rounded mb-2" placeholder="Role" value={role} onChange={(e) => setRole(e.target.value)} />
                <input className="bg-gray-700 w-full p-2 rounded mb-2" placeholder="Mail" value={mail} onChange={(e) => setMail(e.target.value)} />
                <input className="bg-gray-700 w-full p-2 rounded mb-2" placeholder="Percent rate" value={percent} onChange={(e) => setPercent(e.target.value)} />
                <div className="flex justify-end gap-4">
                    <button onClick={onClose} className="px-4 py-2 rounded bg-gray-600 hover:bg-gray-500">Cancel</button>
                    <button onClick={handleSave} className="px-4 py-2 rounded bg-gray-600 hover:bg-gray-500">Save</button>
                </div>
            </div>
        </div>
    );
}