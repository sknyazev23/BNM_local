# Создаем нового сотрудника

from config import workers_collection

# Тестовые данные воркеров
workers_data = [
    {
        "id": "W001",
        "name": "Sergei Kniazev",
        "status": "Sales of project",
        "role": "Sales manager",
        "mail": "bdm.dxb@fourpointgt.com",
        "percent_rate": 10
    },
    {
        "id": "W002",
        "name": "Artem Kovardakov",
        "status": "Logistics",
        "role": "Sales manager",
        "mail": "sales1.novo@primeshipping.com",
        "percent_rate": 10
    },
    {
        "id": "W003",
        "name": "Serdar Jumaev",
        "status": "Manager of project",
        "role": "Director",
        "mail": "serdar@primeshipping.com",
        "percent_rate": 0
    }
]

# Очистим коллекцию перед вставкой (опционально)
workers_collection.delete_many({})

# Вставляем
workers_collection.insert_many(workers_data)

print("✅ Workers inserted successfully!")
