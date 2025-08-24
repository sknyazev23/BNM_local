import { useEffect, useMemo, useRef, useState } from "react";
import API from "../api";

export default function ClientSelect({
  value,
  onChange,
  placeholder = "Client",
  maxItems = 10,
}) {
  const [clients, setClients] = useState([]);
  const [query, setQuery] = useState(value || "");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const wrapRef = useRef(null);
  const listRef = useRef(null);

  // sync внешнего value в инпут
  useEffect(() => { setQuery(value || ""); }, [value]);

  // загрузка клиентов
  useEffect(() => {
    let mounted = true;
    API.get("/clients")
      .then(res => { if (mounted) setClients(res.data || []); })
      .catch(() => { if (mounted) setClients([]); });
    return () => { mounted = false; };
  }, []);

  // список к показу
  const items = useMemo(() => {
    const q = (query || "").trim().toLowerCase();
    const base = !q
      ? clients
      : clients.filter(c => (c.name || "").toLowerCase().includes(q));
    return base.slice(0, maxItems);
  }, [clients, query, maxItems]);

  // клик вне — закрыть
  useEffect(() => {
    const onDoc = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  // выбор элемента
  const selectItem = (c) => {
    const name = c?.name || "";
    onChange?.(name);
    setQuery(name);
    setOpen(false);
    setActive(-1);
  };

  // клавиатура
  const onKeyDown = (e) => {
    if (!open && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
      setOpen(true);
      return;
    }
    if (!open) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((prev) => {
        const next = Math.min((prev < 0 ? -1 : prev) + 1, items.length - 1);
        return next;
      });
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((prev) => Math.max(prev - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (active >= 0 && items[active]) selectItem(items[active]);
    } else if (e.key === "Escape") {
      setOpen(false);
      setActive(-1);
    }
  };

  // скроллим подсвеченный пункт в видимую область
  useEffect(() => {
    if (!open || active < 0 || !listRef.current) return;
    const el = listRef.current.querySelector(`[data-idx="${active}"]`);
    if (el) el.scrollIntoView({ block: "nearest" });
  }, [active, open]);

  return (
    <div ref={wrapRef} style={{ position: "relative", overflow: "visible" }}>
      <input
        className="bg-gray-700 p-2 rounded w-full"
        placeholder={placeholder}
        value={query}
        onFocus={() => setOpen(true)}
        onClick={() => setOpen(true)}  // открыть даже если пусто
        onKeyDown={onKeyDown}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
          setActive(-1);
        }}
      />
      {open && items.length > 0 && (
        <ul
          ref={listRef}
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            marginTop: 6,
            background: "#2d2d2d",
            border: "1px solid #4e6b6aff",
            borderRadius: 8,
            zIndex: 9999,
            maxHeight: 260,
            overflowY: "auto",
            boxShadow: "0 8px 24px rgba(0,0,0,.25)"
          }}
        >
          {items.map((c, idx) => {
            const isActive = idx === active;
            return (
              <li
                key={c._id || c.id || c.name + idx}
                data-idx={idx}
                onMouseDown={(e) => e.preventDefault()} // не терять фокус
                onMouseEnter={() => setActive(idx)}
                onClick={() => selectItem(c)}
                style={{
                  padding: "10px 12px",
                  cursor: "pointer",
                  background: isActive ? "#3b3b3b" : "transparent",
                  color: "#a5f7ecff"
                }}
              >
                {c.name}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
