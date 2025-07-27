import { useState } from "react";
import { Trash2 } from "lucide-react";
import API from "../api";


export default function FileUpload({ onFilesAdded }) {
    const [uploadedFiles, setUploadedFiles] = useState([]);

    const handleDrop = (e) => {
        e.preventDefault();
        const files = Array.from(e.dataTransfer.files);
        setUploadedFiles([...uploadedFiles, ...files]);
        onFilesAdded(files);
    };

    const handleRemove = async (fileName) => {
        if (confirm(`Delete file ${fileName} ?`)) {
            await API.delete(`/docs/${fileName}`);
            setUploadedFiles(uploadedFiles.filter((f) => f.name !== fileName));
        }
    };

    return (
        <div>
            <div
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                className="border-2 border-dashed border-gray-500 p-6 rounded-lg text-center mb-4"
            >
                Take the files here
            </div>
            <ul>
                {uploadedFiles.map((file, index) => (
                    <li key={index} className="flex justify-between items-center bg-gray-700 p-2 rounded mb-2">
                        <span>{file.name}</span>
                        <button
                        onClick={() => handleRemove(file.name)}
                        className="text-red-400 hover: text-red-500 transform hover:scale-110 transition"
                        >
                            <Trash2 size={18} />
                        </button>
                    </li>
                ))}
            </ul>
        </div>
    );
}