from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, Depends
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
import asyncio
import re
import ipaddress
import bcrypt
import jwt
import httpx
from html import escape
from html.parser import HTMLParser
from urllib.parse import urlparse
from datetime import datetime, timezone, timedelta

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI()
api_router = APIRouter(prefix="/api")

JWT_ALGORITHM = "HS256"


def get_jwt_secret() -> str:
    return os.environ["JWT_SECRET"]


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))


def create_access_token(user_id: str, email: str) -> str:
    payload = {
        "sub": user_id,
        "email": email,
        "exp": datetime.now(timezone.utc) + timedelta(hours=12),
        "type": "access",
    }
    return jwt.encode(payload, get_jwt_secret(), algorithm=JWT_ALGORITHM)


async def get_current_admin(request: Request) -> dict:
    token = None
    auth_header = request.headers.get("Authorization", "")
    if auth_header.startswith("Bearer "):
        token = auth_header[7:]
    if not token:
        token = request.cookies.get("access_token")
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(token, get_jwt_secret(), algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "access":
            raise HTTPException(status_code=401, detail="Invalid token type")
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")
    user = await db.users.find_one({"email": payload.get("email"), "role": "admin"}, {"_id": 0, "password_hash": 0})
    if not user:
        raise HTTPException(status_code=401, detail="Admin not found")
    return user


async def seed_admin():
    admin_email = os.environ.get("ADMIN_EMAIL")
    admin_password = os.environ.get("ADMIN_PASSWORD")
    existing = await db.users.find_one({"email": admin_email})
    if existing is None:
        await db.users.insert_one({
            "email": admin_email,
            "password_hash": hash_password(admin_password),
            "name": "Admin",
            "role": "admin",
            "created_at": datetime.now(timezone.utc).isoformat(),
        })
        logger.info(f"Admin seeded: {admin_email}")
    elif not verify_password(admin_password, existing["password_hash"]):
        await db.users.update_one({"email": admin_email}, {"$set": {"password_hash": hash_password(admin_password)}})
        logger.info("Admin password updated from env")

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


EMAIL_BASE_URL = "https://integrations.emergentagent.com"
EMAIL_KEY = os.environ["EMERGENT_EMAIL_KEY"]
EMAIL_FROM_NAME = os.environ["EMAIL_FROM_NAME"]
NOTIFY_EMAIL = os.environ.get("NOTIFY_EMAIL")

_SHORTENERS = ("bit.ly", "tinyurl.com", "t.co", "is.gd", "cutt.ly", "goo.gl", "rebrand.ly")
_CRED_ASK = ("reply with your password", "reply with the code", "send your password", "cvv",
             "send us your password", "enter your password below", "confirm your card number",
             "your full card number", "seed phrase", "recovery phrase", "verify your card",
             "social security number", "confirm your bank details")
_HOSTISH = re.compile(r"\b(?:https?://)?((?:[a-z0-9-]+\.)+[a-z]{2,})", re.I)


def _host_ok(host: str) -> bool:
    if not host or "xn--" in host:
        return False
    try:
        ipaddress.ip_address(host)
        return False
    except ValueError:
        pass
    return not any(host == s or host.endswith("." + s) for s in _SHORTENERS)


def _same_site(shown: str, real: str) -> bool:
    return shown == real or real.endswith("." + shown) or shown.endswith("." + real)


class _EmailScan(HTMLParser):
    def __init__(self):
        super().__init__()
        self.tags, self.urls, self.anchors = set(), [], []
        self._href, self._text = None, []

    def handle_starttag(self, tag, attrs):
        self.tags.add(tag.lower())
        self.urls += [v for k, v in attrs if k.lower() in ("href", "src") and v]
        if tag.lower() == "a":
            self._href = dict((k.lower(), v) for k, v in attrs).get("href")
            self._text = []

    def handle_data(self, data):
        if self._href is not None:
            self._text.append(data)

    def handle_endtag(self, tag):
        if tag.lower() == "a" and self._href is not None:
            self.anchors.append((self._href, "".join(self._text)))
            self._href, self._text = None, []


def _assert_safe_email(subject: str, html: str) -> None:
    scan = _EmailScan()
    scan.feed(html)
    if scan.tags & {"form", "input", "textarea", "select"}:
        raise ValueError("No forms or input fields in email (G2)")
    body = f"{subject}\n{html}".lower()
    for p in _CRED_ASK:
        if p in body:
            raise ValueError(f"Email asks the recipient for credentials: {p!r} (G2)")
    for url in scan.urls:
        low = url.strip().lower()
        if low.startswith(("mailto:", "tel:", "cid:", "#")):
            continue
        if not low.startswith("https://"):
            raise ValueError(f"Email links/assets must be absolute https: {url!r} (G3)")
        host = urlparse(low).hostname or ""
        if not _host_ok(host) or urlparse(low).username is not None:
            raise ValueError(f"Shortened, numeric-host or credential-bearing URL: {url!r} (G3)")
    for href, text in scan.anchors:
        real = urlparse(href.strip().lower()).hostname or ""
        if not real:
            continue
        for m in _HOSTISH.finditer(text):
            if not _same_site(m.group(1).lower(), real):
                raise ValueError(f"Anchor text {m.group(1)!r} ≠ real link host {real!r} (G3)")


async def send_email(*, to: str, subject: str, html: str, reply_to: str = None):
    _assert_safe_email(subject, html)
    payload = {"to": [to], "subject": subject, "html": html, "from_name": EMAIL_FROM_NAME}
    if reply_to:
        payload["contact_email"] = reply_to
    try:
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.post(
                f"{EMAIL_BASE_URL}/api/v1/email/send",
                headers={"X-Email-Key": EMAIL_KEY},
                json=payload,
            )
        resp.raise_for_status()
        logger.info(f"Email sent to {to}: {resp.json().get('id')}")
        return resp.json().get("id")
    except Exception as e:
        logger.error(f"Email send error: {e}")
        return None


async def notify_new_enquiry(enquiry) -> None:
    if not NOTIFY_EMAIL:
        return
    subject = f"New KARUMBU enquiry — {enquiry.name} ({enquiry.quantity} bottles)"
    message_row = (
        f'<p style="margin:0 0 12px;color:#939E96">Message: {escape(enquiry.message)}</p>'
        if enquiry.message else ""
    )
    html = (
        '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" '
        'style="background:#0A100C;padding:32px 0"><tr><td align="center">'
        '<table role="presentation" width="520" cellpadding="0" cellspacing="0" '
        'style="background:#121E15;border:1px solid #213827;font-family:Arial,sans-serif">'
        '<tr><td style="padding:24px 28px;border-bottom:1px solid #213827">'
        '<span style="color:#C86A23;font-size:12px;letter-spacing:3px">KARUMBU</span>'
        '<h1 style="color:#F4EBE1;font-size:22px;font-weight:400;margin:10px 0 0">New order enquiry</h1>'
        '</td></tr>'
        '<tr><td style="padding:20px 28px;color:#F4EBE1;font-size:14px;line-height:1.7">'
        f'<p style="margin:0 0 12px"><strong>{escape(enquiry.name)}</strong> wants '
        f'<strong>{enquiry.quantity}</strong> bottle(s) of '
        f'<strong style="color:#C86A23">{escape(enquiry.product)}</strong>.</p>'
        f'<p style="margin:0 0 12px;color:#939E96">Phone: {escape(enquiry.phone)}</p>'
        f'{message_row}'
        '</td></tr>'
        '<tr><td style="padding:16px 28px;border-top:1px solid #213827;color:#939E96;font-size:11px">'
        f'Sent by {escape(EMAIL_FROM_NAME)} order alerts. We never ask for your password or card details by email.'
        '</td></tr></table></td></tr></table>'
    )
    await send_email(to=NOTIFY_EMAIL, subject=subject, html=html)


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
    asyncio.create_task(notify_new_enquiry(enquiry))
    return enquiry


class LoginInput(BaseModel):
    email: str
    password: str


@api_router.post("/auth/login")
async def login(input: LoginInput, response: Response):
    email = input.email.lower().strip()
    user = await db.users.find_one({"email": email, "role": "admin"})
    if not user or not verify_password(input.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    token = create_access_token(str(user["_id"]), email)
    response.set_cookie(key="access_token", value=token, httponly=True, secure=True, samesite="none", max_age=43200, path="/")
    return {"token": token, "user": {"email": email, "name": user.get("name", "Admin"), "role": "admin"}}


@api_router.get("/auth/me")
async def auth_me(admin=Depends(get_current_admin)):
    return admin


@api_router.get("/enquiries", response_model=List[Enquiry])
async def list_enquiries(admin=Depends(get_current_admin)):
    items = await db.enquiries.find({}, {"_id": 0}).sort("created_at", -1).to_list(500)
    for item in items:
        if isinstance(item.get('created_at'), str):
            item['created_at'] = datetime.fromisoformat(item['created_at'])
    return items


class StatusUpdate(BaseModel):
    status: str = Field(pattern="^(new|contacted|done)$")


@api_router.patch("/enquiries/{enquiry_id}")
async def update_enquiry_status(enquiry_id: str, input: StatusUpdate, admin=Depends(get_current_admin)):
    result = await db.enquiries.update_one({"id": enquiry_id}, {"$set": {"status": input.status}})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Enquiry not found")
    return {"id": enquiry_id, "status": input.status}


@api_router.delete("/enquiries/{enquiry_id}")
async def delete_enquiry(enquiry_id: str, admin=Depends(get_current_admin)):
    result = await db.enquiries.delete_one({"id": enquiry_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Enquiry not found")
    return {"deleted": enquiry_id}


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


@app.on_event("startup")
async def startup_seed():
    await seed_admin()


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
