
from routes.job_routers import generate_job_id
from config import jobs_collection

res = generate_job_id()
job_id = res['job_id']
print('Generated:', job_id)

job = jobs_collection.find_one({'_id': job_id})
print('Found in DB:', job)

print('All jobs count:', jobs_collection.count_documents({}))

