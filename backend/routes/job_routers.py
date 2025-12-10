from fastapi import APIRouter, HTTPException, Body
from pymongo.errors import DuplicateKeyError
from models.job_model import Job
from config import jobs_collection, sales_collection, expenses_collection, documents_collection, workers_collection
from bson import ObjectId
from collections import Counter
from datetime import datetime, timezone, date as _date

router = APIRouter()

def _recalc_job_summary(job_id: str):
    job = jobs_collection.find_one({"_id": job_id}, {"main_part": 1}) or {}
    mp = job.get("main_part") or {}

    # курсы
    rate_aed = float(mp.get("rate_aed_to_usd") or 3.67)
    rr = mp.get("rate_rub_to_usd")
    rate_rub = float(rr) if rr not in (None, "",) else None

    def to_usd(val, cur):
        cur = (cur or "USD").upper()
        v = float(val or 0)
        if cur == "USD": return v
        if cur == "AED": return v / (rate_aed or 3.67)
        if cur == "RUB" and rate_rub: return v / rate_rub
        return 0.0

    # дочерние документы
    sales = list(sales_collection.find({"job_id": job_id}, {"amount": 1, "workers": 1}))
    exps  = list(expenses_collection.find({"job_id": job_id}, {"quantity":1,"unit_cost":1,"currency":1,"cost":1,"workers":1}))

    # profit_usd
    sales_usd = 0.0
    for s in sales:
        for cur, val in (s.get("amount") or {}).items():
            sales_usd += to_usd(val, cur)

    exp_usd = 0.0
    for e in exps:
        cost = e.get("cost") or {}
        if cost:
            for cur, val in cost.items():
                exp_usd += to_usd(val, cur)
        else:
            exp_usd += to_usd((e.get("quantity") or 0) * (e.get("unit_cost") or 0), e.get("currency"))
    profit_usd = round(sales_usd - exp_usd, 2)

    # workers: имена (основной + ко-воркеры), порядок по частоте
    ids = []
    for s in sales: ids += [str(w) for w in (s.get("workers") or [])]
    for e in exps:  ids += [str(w) for w in (e.get("workers") or [])]

    names: list[str] = []
    if ids:
        uniq = [ObjectId(x) for x in set(ids) if ObjectId.is_valid(x)]
        name_by_id = {}
        if uniq:
            for w in workers_collection.find({"_id": {"$in": uniq}}, {"name": 1}):
                name_by_id[str(w["_id"])] = w.get("name") or str(w["_id"])
        freq = Counter(ids)
        order = sorted(freq.keys(), key=lambda x: (-freq[x], name_by_id.get(x, x)))
        names = [name_by_id.get(x, x) for x in order]

    jobs_collection.update_one(
        {"_id": job_id},
        {"$set": {"profit_usd": profit_usd, "workers": names}}
    )


def _normalize(o):
    if isinstance(o, ObjectId):
        return str(o)
    if isinstance(o, list):
        return [_normalize(x) for x in o]
    if isinstance(o, dict):
        return {k: _normalize(v) for k, v in o.items()}
    return o


@router.get("/")
def get_all_jobs():
    rows = []

    for job in jobs_collection.find():
        jid = str(job.get("_id"))
        mp = job.get("main_part") or {}
        is_arch = bool(job.get("archived", False))

        rows.append({
            "_id": jid,
            "bn_number": mp.get("bn_number"),
            "client_name": mp.get("client_name"),
            "status": "Archived" if is_arch else "Open",
            "created_at": mp.get("created_at"),
            "closed_at": mp.get("closed_at"),
            "serviceDone": job.get("delivery_date"),
            "workers": job.get("workers", []),
            "profit_usd": job.get("profit_usd", 0),
        })
    return rows

@router.post("/")
def create_job(job: Job = Body(...)):
    data = job.model_dump(by_alias=True)
    print("DATA FROM MODEL DUMP:", data)

    # 1) Достаём кастомный job_id
    job_id = data.get("_id")

    # 2) Сохраняем документ с пользовательским строковым ID
    try:
        jobs_collection.insert_one({
            "_id": job_id,
            **data
        })
    except DuplicateKeyError:
        raise HTTPException(status_code=409, detail="Job with this ID already exists")

    # 3) Пересчёт profit_usd, workers и т.п.
    _recalc_job_summary(job_id)

    return {"_id": job_id}
