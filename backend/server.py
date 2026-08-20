from fastapi import FastAPI, APIRouter
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI()
api_router = APIRouter(prefix="/api")

PRODUCTS = [
    {
        "slug": "classic",
        "name": "Classic Karumbu",
        "tagline": "Jaggery · Dry Ginger · Cardamom",
        "price": 99,
        "unit": "250 ml bottle",
        "description": "The original temple-festival panakam. Cold-pressed sugarcane, hand-pounded jaggery and a whisper of cardamom.",
        "image": "https://images.pexels.com/photos/12741759/pexels-photo-12741759.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
        "badge": "Signature",
    },
    {
        "slug": "sukku-malli",
        "name": "Sukku Malli",
        "tagline": "Dry Ginger · Coriander · Cane",
        "price": 129,
        "unit": "250 ml bottle",
        "description": "A fiery, digestive brew. Sun-cured dry ginger and coriander seed folded into fresh cane juice.",
        "image": "https://images.unsplash.com/photo-1612846213933-916a1f56d859?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjY2NjV8MHwxfHNlYXJjaHwxfHxjb3BwZXIlMjBnbGFzcyUyMHRyYWRpdGlvbmFsJTIwSW5kaWFuJTIwZHJpbmt8ZW58MHx8fHwxNzg3MTk1MTQ0fDA&ixlib=rb-4.1.0&q=85",
        "badge": "Small Batch",
    },
    {
        "slug": "elakkai-rose",
        "name": "Elakkai Rose",
        "tagline": "Cardamom · Rose · Jaggery",
        "price": 149,
        "unit": "250 ml bottle",
        "description": "Our festive pour. Fragrant elakkai and rose petals steeped overnight in jaggery-sweet cane nectar.",
        "image": "https://images.pexels.com/photos/12741759/pexels-photo-12741759.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
        "badge": "Festive",
    },
]


class EnquiryCreate(BaseModel):
    name: str = Field(min_length=2, max_length=80)
    phone: str = Field(min_length=7, max_length=15)
    product: str = Field(min_length=2, max_length=60)
    quantity: int = Field(ge=1, le=1000)
    message: Optional[str] = ""


class Enquiry(BaseModel):
    model_config = ConfigDict(extra="ignore")

    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    phone: str
    product: str
    quantity: int
    message: str = ""
    status: str = "new"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


@api_router.get("/")
async def root():
    return {"message": "KARUMBU API — sugarcane panakam, bottled."}


@api_router.get("/products")
async def get_products():
    return PRODUCTS


@api_router.post("/enquiries", response_model=Enquiry)
async def create_enquiry(input: EnquiryCreate):
    enquiry = Enquiry(**input.model_dump())
    doc = enquiry.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.enquiries.insert_one(doc)
    return enquiry


@api_router.get("/enquiries", response_model=List[Enquiry])
async def list_enquiries():
    items = await db.enquiries.find({}, {"_id": 0}).sort("created_at", -1).to_list(500)
    for item in items:
        if isinstance(item.get('created_at'), str):
            item['created_at'] = datetime.fromisoformat(item['created_at'])
    return items


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
