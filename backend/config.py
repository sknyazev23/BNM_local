from pymongo import MongoClient


client = MongoClient("mongodb://localhost:27017")

db = client["work_manager"]

jobs_collection = db["Jobs"]
workers_collection = db["Workers"]
clients_collection = db["Clients"]
docs_collection = db["Docs"]
sales_collection = db["Sales"]
expenses_collection = db["Expenses"]