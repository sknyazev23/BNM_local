
import { useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";

// стабильная сериализация: сортируем ключи объектов
function stableStringify(value) {
  const seen = new WeakSet();
  return JSON.stringify(value, function (k, v) {
    if (v && typeof v === "object") {
      if (seen.has(v)) return;
      seen.add(v);
      if (!Array.isArray(v)) {
        const out = {};
        for (const key of Object.keys(v).sort()) out[key] = v[key];
        return out;
      }
    }
    return v;
  });
}

export default function useCloseJob(buildFn, saveJob, jobId) {
  const navigate = useNavigate();
  const snapRef = useRef(null);

  const setSnapshot = useCallback(() => {
    if (typeof buildFn !== "function") return;
    snapRef.current = buildFn();
  }, [buildFn]);

  const isDirty = useCallback(() => {
    if (typeof buildFn !== "function") return false;
    if (!snapRef.current) return false;
    try {
      return stableStringify(buildFn()) !== stableStringify(snapRef.current);
    } catch {
      return false;
    }
  }, [buildFn]);

  const exitToDashboard = useCallback(async () => {
    if (isDirty()) {
      const ok = confirm("Save changes before leaving?");
      if (ok) {
        await saveJob(); // ошибки покажет сам saveJob
      }
    }
    navigate("/dashboard"); // путь к вашему Dashboard
  }, [isDirty, saveJob, navigate]);

  return { exitToDashboard, setSnapshot, isDirty };
}
