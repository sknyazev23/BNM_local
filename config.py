from pymongo import MongoClient


client = MongoClient("mongodb://localhost:27017")
db = client["work_manager"]
files_collection = db["files"]   # collection for Metadata