import { useState, useEffect } from "react";
import { Trash2 } from "lucide-react";
import API from "../api";


export default function FileUpload({ jobId }) {
    const [files, setFiles] = useState([]);
    const [isUploading, setIsUploading] = useState(false)

    useEffect(() => {
        if (jobId) fetchFiles();
    }, [jobId]);

    const fetchFiles = async () => {
        const res = await API.get(`/docs/${jobId}`);
        setFiles(res.data);
    };


    const handleDrop = async (e) => {
        e.preventDefault();
        const droppedFiles = Array.from(e.dataTransfer.files);
        await uploadedFiles(droppedFiles);
    };

    const uploadedFiles = async (fileList) => {
        if (!jobId) {
            alert("Put th Job ID first!");
            return;
        }

        setIsUploading(true);
        for (let file of fileList) {
            const formData = new FormData();
            formData.append("Job_id", jobId);
            formData.append("creator", "Admin");
            formData.append("worker_id", "");
            formData.append("status", "plan");
            formData.append("file", file);

            await API.post("/upload", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });
        }
        setIsUploading(false);
        fetchFiles();
    };


    const handleRemove = async (docId) => {
        if (confirm("Delete file?")) {
            await API.delete(`/docs/${docId}`);
            fetchFiles()
        }
    };

    return (
        <div>
            <div
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                className="border-2 border-dashed border-gray-500 p-6 rounded-lg text-center mb-4"
            >
                {isUploading ? "Loading..." : "Take the files here"}
            </div>
            <ul>
                {files.map((file) => (
                    <li key={file._id} className="flex justify-between items-center bg-gray-700 p-2 rounded mb-2">
                        <span>{file.name}</span>
                        <button
                        onClick={() => handleRemove(file._id)}
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