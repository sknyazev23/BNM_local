from typing import List, Dict
from collections import Counter
from bson import ObjectId
from config import jobs_collection, sales_collection, expenses_collection, workers_collection

def recalc_job_summary(job_id: str):
    job = jobs_collection.find_one({"_id": job_id}, {"main_part": 1}) or {}
    mp = job.get("main_part") or {}

    # курсы
    rate_aed = float(str(mp.get("rate_aed_to_usd") or "3.67"))
    rr = mp.get("rate_rub_to_usd")
    rate_rub = float(str(rr)) if rr not in (None, "",) else None

    def to_usd(val, cur):
        cur = (cur or "USD").upper()
        v = float(val or 0)
        if cur == "USD": return v
        if cur == "AED": return v / (rate_aed or 3.67)
        if cur == "RUB" and rate_rub: return v / rate_rub
        return 0.0

    # дочерние документы
    sales = list(sales_collection.find({"job_id": job_id}, {"_id": 1, "amount_origin": 1, "currency_origin": 1, "amount_aed": 1, "workers": 1, "worker_id": 1, "coworker_id": 1}))
    exps  = list(expenses_collection.find({"job_id": job_id}, {"_id": 1, "amount_origin": 1, "currency_origin": 1, "amount_aed": 1, "workers": 1, "worker_id": 1}))

    # profit_usd = total_sales_usd - total_expenses_usd
    sales_usd = 0.0
    for s in sales:
        sales_usd += to_usd(s.get("amount_origin", 0), s.get("currency_origin", "USD"))
        
    exp_usd = 0.0
    for e in exps:
        exp_usd += to_usd(e.get("amount_origin", 0), e.get("currency_origin", "USD"))
    
    profit_usd = round(float(sales_usd - exp_usd), 2)

    # workers: имена (основной + ко-воркеры), порядок по частоте
    ids = []
    for doc_list in [sales, exps]:
        for doc in doc_list:
            # array of workers if provided
            for w in (doc.get("workers") or []):
                ids.append(str(w))
            # single worker_id if provided
            w_id = doc.get("worker_id")
            if w_id and str(w_id).strip():
                ids.append(str(w_id))
            # single coworker_id if provided (usually in sales)
            cw_id = doc.get("coworker_id")
            if cw_id and str(cw_id).strip():
                ids.append(str(cw_id))

    names: List[str] = []
    if ids:
        uniq = [ObjectId(x) for x in set(ids) if ObjectId.is_valid(x)]
        name_by_id: Dict[str, str] = {}
        if uniq:
            for w in workers_collection.find({"_id": {"$in": uniq}}, {"name": 1}):
                name_by_id[str(w["_id"])] = str(w.get("name") or str(w["_id"]))
        freq = Counter(ids)
        order = sorted(freq.keys(), key=lambda x: (-freq[x], name_by_id.get(x, x)))
        names = [str(name_by_id.get(x, x)) for x in order]

    # collect _id references for denormalised arrays
    sales_ids = [str(s["_id"]) for s in sales]
    expenses_ids = [str(e["_id"]) for e in exps]

    jobs_collection.update_one(
        {"_id": job_id},
        {"$set": {
            "profit_usd": profit_usd,
            "workers": names,
            "sales_part": sales_ids,
            "expenses_part": expenses_ids,
        }}
    )
