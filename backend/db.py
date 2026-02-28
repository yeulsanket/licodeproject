from pymongo import MongoClient
from config import Config

# Global db client
mongo_client = None

def get_db():
    global mongo_client
    if mongo_client is None:
        mongo_client = MongoClient(Config.MONGO_URI)
    return mongo_client[Config.MONGO_DB_NAME]
