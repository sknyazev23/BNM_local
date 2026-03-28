import requests
import json

BASE_URL = "http://localhost:8000"

def test_bulk_delete():
    # 1. Create two test jobs
    job_ids = []
    for i in range(2):
        res = requests.get(f"{BASE_URL}/jobs/generate-id")
        job_id = res.json()["job_id"]
        job_ids.append(job_id)
        
        # Create the job skeleton
        requests.post(f"{BASE_URL}/jobs/", json={
            "_id": job_id,
            "main_part": {"bn_number": f"TEST_BULK_{i}"}
        })
        
        # Add a sale to each
        requests.post(f"{BASE_URL}/sales/", json={
            "job_id": job_id,
            "description": "Test Sale",
            "amount_origin": 100,
            "currency": "USD"
        })

    print(f"Created test jobs: {job_ids}")

    # 2. Bulk delete
    del_res = requests.post(f"{BASE_URL}/jobs/bulk-delete", json=job_ids)
    print(f"Bulk delete response: {del_res.json()}")

    # 3. Verify
    for jid in job_ids:
        job_check = requests.get(f"{BASE_URL}/jobs/{jid}")
        if job_check.status_code == 404:
            print(f"Job {jid} deleted successfully")
        else:
            print(f"FAILED: Job {jid} still exists!")

        sales_check = requests.get(f"{BASE_URL}/sales/?job_id={jid}")
        sales = sales_check.json()
        if not sales:
            print(f"Sales for {jid} deleted successfully")
        else:
            print(f"FAILED: Sales for {jid} still exist: {sales}")

if __name__ == "__main__":
    test_bulk_delete()
