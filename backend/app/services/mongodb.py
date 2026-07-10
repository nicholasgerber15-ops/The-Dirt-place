from typing import Optional
from datetime import datetime
from app.core.config import get_settings

settings = get_settings()


class MongoDBService:
    """MongoDB service - runs in-memory fallback when MongoDB is unavailable."""

    def __init__(self):
        self.client = None
        self.db = None
        self._enabled = bool(settings.mongodb_url)
        self._memory_store: dict[str, list[dict]] = {}

    async def connect(self):
        if not self._enabled:
            print("No MongoDB URL configured - using in-memory storage")
            return
        try:
            from motor.motor_asyncio import AsyncIOMotorClient
            self.client = AsyncIOMotorClient(settings.mongodb_url, serverSelectionTimeoutMS=2000)
            self.db = self.client[settings.mongodb_db_name]
            await self.db.scan_results.create_index("site_id")
            print("MongoDB connected")
        except Exception as e:
            print(f"MongoDB unavailable, using in-memory: {e}")
            self._enabled = False

    async def close(self):
        if self.client:
            self.client.close()

    def _mem_insert(self, collection: str, document: dict) -> str:
        import uuid
        doc_id = str(uuid.uuid4())
        document["_id"] = doc_id
        self._memory_store.setdefault(collection, []).append(document)
        return doc_id

    def _mem_find(self, collection: str, filter: dict = None, sort: list = None, limit: int = 100) -> list:
        docs = self._memory_store.get(collection, [])
        if filter:
            docs = [d for d in docs if all(d.get(k) == v for k, v in filter.items())]
        if sort:
            key = sort[0][0]
            reverse = sort[0][1] == -1 if len(sort[0]) > 1 else False
            docs = sorted(docs, key=lambda d: d.get(key, ""), reverse=reverse)
        return docs[:limit]

    async def insert(self, collection: str, document: dict) -> str:
        document["created_at"] = datetime.utcnow()
        if self._enabled:
            result = await self.db[collection].insert_one(document)
            return str(result.inserted_id)
        return self._mem_insert(collection, document)

    async def find_one(self, collection: str, filter: dict) -> Optional[dict]:
        if self._enabled:
            doc = await self.db[collection].find_one(filter)
            if doc:
                doc["_id"] = str(doc["_id"])
            return doc
        docs = self._mem_find(collection, filter, limit=1)
        return docs[0] if docs else None

    async def find(self, collection: str, filter: dict = None, sort: list = None, limit: int = 100) -> list:
        if self._enabled:
            cursor = self.db[collection].find(filter or {})
            if sort:
                cursor = cursor.sort(sort)
            cursor = cursor.limit(limit)
            docs = []
            async for doc in cursor:
                doc["_id"] = str(doc["_id"])
                docs.append(doc)
            return docs
        return self._mem_find(collection, filter, sort, limit)

    async def update(self, collection: str, filter: dict, update: dict) -> int:
        update["updated_at"] = datetime.utcnow()
        if self._enabled:
            result = await self.db[collection].update_one(filter, {"$set": update})
            return result.modified_count
        count = 0
        for doc in self._memory_store.get(collection, []):
            if all(doc.get(k) == v for k, v in filter.items()):
                doc.update(update)
                count += 1
        return count

    async def delete(self, collection: str, filter: dict) -> int:
        if self._enabled:
            result = await self.db[collection].delete_one(filter)
            return result.deleted_count
        before = len(self._memory_store.get(collection, []))
        self._memory_store[collection] = [
            d for d in self._memory_store.get(collection, [])
            if not all(d.get(k) == v for k, v in filter.items())
        ]
        return before - len(self._memory_store.get(collection, []))

    async def save_scan_result(self, site_id: int, scan_type: str, result: dict) -> str:
        return await self.insert("scan_results", {"site_id": site_id, "scan_type": scan_type, "result": result})

    async def get_scan_history(self, site_id: int, limit: int = 50) -> list:
        return await self.find("scan_results", filter={"site_id": site_id}, sort=[("timestamp", -1)], limit=limit)

    async def log_activity(self, user_id: int, action: str, resource_type: str, details: dict = None) -> str:
        return await self.insert("activity_logs", {"user_id": user_id, "action": action, "resource_type": resource_type, "details": details or {}})

    async def get_activity_logs(self, user_id: int = None, limit: int = 100) -> list:
        f = {"user_id": user_id} if user_id else {}
        return await self.find("activity_logs", filter=f, sort=[("timestamp", -1)], limit=limit)

    async def save_metric(self, site_id: int, metric_name: str, value: float, tags: dict = None) -> str:
        return await self.insert("metrics", {"site_id": site_id, "metric_name": metric_name, "value": value, "tags": tags or {}})

    async def get_metrics(self, site_id: int, metric_name: str, hours: int = 24) -> list:
        from datetime import timedelta
        since = datetime.utcnow() - timedelta(hours=hours)
        return await self.find("metrics", filter={"site_id": site_id, "metric_name": metric_name}, sort=[("timestamp", -1)])

    async def save_chat_message(self, user_id: int, session_id: str, role: str, content: str) -> str:
        return await self.insert("chat_history", {"user_id": user_id, "session_id": session_id, "role": role, "content": content})

    async def get_chat_history(self, session_id: str, limit: int = 50) -> list:
        return await self.find("chat_history", filter={"session_id": session_id}, sort=[("timestamp", 1)], limit=limit)

    async def save_alert(self, site_id: int, alert_type: str, severity: str, message: str) -> str:
        return await self.insert("alerts", {"site_id": site_id, "alert_type": alert_type, "severity": severity, "message": message, "acknowledged": False})

    async def get_active_alerts(self, site_id: int = None) -> list:
        f = {"acknowledged": False}
        if site_id:
            f["site_id"] = site_id
        return await self.find("alerts", filter=f, sort=[("timestamp", -1)])

    async def acknowledge_alert(self, alert_id: str) -> int:
        return await self.update("alerts", {"_id": alert_id}, {"acknowledged": True})


mongodb = MongoDBService()
