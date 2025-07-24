import { Trash2, Plus } from "lucide-react";


export default function SaleBlock({ sale, index, onChange, onRemove, workers, onAddWorker }) {
    return (
        <div className="bg-gray-700 p-4 rounded-lg mb-3">
            <div className="flex justify-between mb-2">
                <h4 className="text-lg">Sale #{index +1}</h4>
                <button
                    onClick={() => onRemove(index)}
                    className="text-red-400 hover:text-red-500 transform hover:scale-110 transition"
                    >
                        <Trash2 size={20} />
                    </button>
            </div>
            <input
                className="w-full bg-gray-600 p-2 rounded mb-2"
                placeholder="Description"
                value={sale.description}
                onChange={(e) => onChange(index, "description", e.target.value)}
            />
            <input
                className="w-full bg-gray-600 p-2 rounded mb-2"
                placeholder="Sale (USD)"
                type="number"
                value={sale.cost.USD}
                onChange={(e) =>
                    onChange(index, "cost", { ...sale.cost, USD: parseFloat(e.target.value) })
                }
            />
            <div className="flex gap-2 items-center">
                <select
                    className="bg-gray-600 p-2 rounded w-full"
                    value={sale.worker || ""}
                    onChange={(e) => onChange(index, "worker", e.target.value)}
                >
                    <option value="">Choose worker</option>
                    {workers.map((w) => (
                        <option key={w.id} value={w.id}>
                            {w.name}
                        </option>
                    ))}
                </select>
                <button
                    onClick={onAddWorker}
                    className="bg-blue-600 text-white px-2 rounded hover:bg-blue-700 transform hover:scale-105"
                >
                    <Plus size={18} />
                </button>    
            </div>
        </div>
    );
}