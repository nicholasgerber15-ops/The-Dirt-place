# UNIVERSAL NRG-CO HEADER BLOCK
# Use this exact banner at the top of source files. License/covenant terms still apply.
#
################################################################
#                                                              #
#                ⚡  N R G - C O  ⚡                          #
#                                                              #
#    CRITICAL ASSET — CLOSED SOURCE / CONFIDENTIAL              #
#    PROPRIETARY / UNDER DEVELOPMENT / SECRET                   #
#                                                              #
################################################################
from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum


class PricingUnit(str, Enum):
    cubic_yard = "cubic_yard"
    ton = "ton"
    pallet = "pallet"
    bag = "bag"
    each = "each"
    mile = "mile"
    flat = "flat"
    percentage = "percentage"


class MaterialStatus(str, Enum):
    draft = "draft"
    published = "published"
    archived = "archived"


class Pricing(BaseModel):
    retail_price_cents: int = Field(ge=0)
    contractor_price_cents: Optional[int] = Field(default=None, ge=0)
    unit: PricingUnit = Field(default=PricingUnit.each)
    currency: str = Field(default="USD", min_length=3, max_length=3)
    minimum_quantity: float = Field(default=1, ge=0)
    source: str = Field(default="quickbooks")
    quickbooks_item_id: Optional[str] = Field(default=None, max_length=100)
    quickbooks_synced_at: Optional[datetime] = Field(default=None)
    quickbooks_updated_at: Optional[datetime] = Field(default=None)
    sync_status: str = Field(default="current")
    override_price_cents: Optional[int] = Field(default=None, ge=0)
    override_reason: str = Field(default="", max_length=500)
    override_created_by: Optional[str] = Field(default=None, max_length=100)
    override_created_at: Optional[datetime] = Field(default=None)
    override_expires_at: Optional[datetime] = Field(default=None)


class MaterialImage(BaseModel):
    key: str
    url: str
    alt_text: str = Field(default="", max_length=255)
    position: int = Field(default=0, ge=0)
    is_primary: bool = Field(default=False)
    width: Optional[int] = Field(default=None, ge=1)
    height: Optional[int] = Field(default=None, ge=1)
    content_type: Optional[str] = Field(default=None, max_length=100)
    size_bytes: Optional[int] = Field(default=None, ge=0)


class Availability(BaseModel):
    in_stock: bool = Field(default=True)
    quantity: Optional[float] = Field(default=None, ge=0)
    seasonal: bool = Field(default=False)


class MaterialBase(BaseModel):
    model_config = ConfigDict(populate_by_name=True, extra="ignore")

    name: str = Field(min_length=1, max_length=255)
    slug: str = Field(min_length=1, max_length=255)
    short_description: str = Field(default="", max_length=500)
    description: str = Field(default="", max_length=5000)
    category: str = Field(default="", max_length=100)
    pricing: Pricing
    images: List[MaterialImage] = Field(default_factory=list)
    specifications: Dict[str, Any] = Field(default_factory=dict)
    recommended_uses: List[str] = Field(default_factory=list)
    availability: Availability = Field(default_factory=Availability)
    featured: bool = Field(default=False)
    status: MaterialStatus = Field(default=MaterialStatus.draft)
    display_order: int = Field(default=0, ge=0)
    product_details: str = Field(default="", max_length=2000)
    quickbooks_item_id: Optional[str] = Field(default=None, max_length=100)


class MaterialCreate(MaterialBase):
    pass


class MaterialUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=255)
    slug: Optional[str] = Field(default=None, min_length=1, max_length=255)
    short_description: Optional[str] = Field(default=None, max_length=500)
    description: Optional[str] = Field(default=None, max_length=5000)
    category: Optional[str] = Field(default=None, max_length=100)
    specifications: Optional[Dict[str, Any]] = Field(default=None)
    recommended_uses: Optional[List[str]] = Field(default=None)
    availability: Optional[Availability] = Field(default=None)
    featured: Optional[bool] = Field(default=None)
    status: Optional[MaterialStatus] = Field(default=None)
    display_order: Optional[int] = Field(default=None, ge=0)
    product_details: Optional[str] = Field(default=None, max_length=2000)


class MaterialResponse(MaterialBase):
    id: str
    created_at: datetime
    updated_at: datetime
    published_at: Optional[datetime] = Field(default=None)
    version: int = Field(default=1)


class PriceHistoryEntry(BaseModel):
    material_id: str
    quickbooks_item_id: Optional[str] = None
    previous_price_cents: Optional[int] = None
    new_price_cents: Optional[int] = None
    previous_contractor_price_cents: Optional[int] = None
    new_contractor_price_cents: Optional[int] = None
    currency: str = Field(default="USD")
    source: str = Field(default="quickbooks_sync")
    sync_id: Optional[str] = None
    changed_by: str
    changed_at: datetime
    reason: str = Field(default="", max_length=500)


class QuickBooksConnection(BaseModel):
    provider: str = Field(default="quickbooks")
    environment: str = Field(default="sandbox")
    realm_id: str
    company_name: str
    access_token_ciphertext: str
    refresh_token_ciphertext: str
    access_token_expires_at: Optional[datetime] = None
    refresh_token_expires_at: Optional[datetime] = None
    scopes: List[str] = Field(default_factory=list)
    status: str = Field(default="connected")
    connected_by: str
    connected_at: datetime
    last_refreshed_at: Optional[datetime] = None
    last_sync_at: Optional[datetime] = None
    last_sync_status: Optional[str] = None
    last_error_code: Optional[str] = None
    version: int = Field(default=1)


class QuickBooksSyncReport(BaseModel):
    sync_id: str
    started_at: datetime
    finished_at: Optional[datetime] = None
    status: str
    created: int = 0
    updated: int = 0
    skipped: int = 0
    conflicts: List[Dict[str, Any]] = Field(default_factory=list)
    failures: List[Dict[str, Any]] = Field(default_factory=list)
    summary: str = ""


class IntegrationAuditLog(BaseModel):
    provider: str
    event: str
    actor: str
    timestamp: datetime
    outcome: str
    error_code: Optional[str] = None
    details: Dict[str, Any] = Field(default_factory=dict)
