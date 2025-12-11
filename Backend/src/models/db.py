"""Database file"""

from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base
from sqlalchemy.orm import sessionmaker

# Call the configuration of project
from src.settings import settings 

# Create a motor for SQLite
engine = create_engine(settings.DB_FILENAME, connect_args={"check_same_thread": False})

# Create a sessionmaker
session = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create a declarative database
Base = declarative_base()

# Method for 
def get_db():
	db = session()
	try:
		yield db # Acá básicamente lo que hacemos es dejar a la base de datos para que un endpoint pueda usarla
	finally:
		db.close()

