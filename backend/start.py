"""
Initialize database tables and run server
"""
import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from models.database import create_tables
create_tables()
print("✅ Database tables created")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
