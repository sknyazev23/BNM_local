from pymongo import MongoClient

client = MongoClient("mongodb://localhost:27017")
db = client["work_manager"]


jobs_collection      = db["jobs"]
sales_collection     = db["sales"]
expenses_collection  = db["expenses"]
documents_collection = db["documents"]
workers_collection   = db["workers"]
clients_collection   = db["clients"]