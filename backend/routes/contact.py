import os
import asyncio
import logging
import resend
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr
from dotenv import load_dotenv
from pathlib import Path

# Load environment variables
ROOT_DIR = Path(__file__).parent.parent
load_dotenv(ROOT_DIR / '.env')

# Configure Resend
resend.api_key = os.environ.get('RESEND_API_KEY')
SENDER_EMAIL = os.environ.get('SENDER_EMAIL', 'onboarding@resend.dev')
BUSINESS_EMAIL = os.environ.get('BUSINESS_EMAIL', 'info@thedirtplace.com')

# Configure logging
logger = logging.getLogger(__name__)

router = APIRouter()

class ContactFormRequest(BaseModel):
    name: str
    phone: str
    email: EmailStr
    material: str = ""
    message: str

@router.post("/contact")
async def submit_contact_form(request: ContactFormRequest):
    """
    Handle contact form submission and send email via Resend
    """
    try:
        # Create HTML email content
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{
                    font-family: 'Montserrat', Arial, sans-serif;
                    line-height: 1.6;
                    color: #3B2F2F;
                }}
                .container {{
                    max-width: 600px;
                    margin: 0 auto;
                    padding: 20px;
                }}
                .header {{
                    background-color: #3B2F2F;
                    color: #FAF9F6;
                    padding: 30px;
                    text-align: center;
                    border-radius: 8px 8px 0 0;
                }}
                .header h1 {{
                    margin: 0;
                    font-size: 28px;
                    font-weight: bold;
                }}
                .header p {{
                    margin: 5px 0 0 0;
                    color: #D9A441;
                    font-size: 14px;
                }}
                .content {{
                    background-color: #FAF9F6;
                    padding: 30px;
                    border: 2px solid #6B4F3F;
                    border-top: none;
                    border-radius: 0 0 8px 8px;
                }}
                .field {{
                    margin-bottom: 20px;
                }}
                .label {{
                    font-weight: bold;
                    color: #6B4F3F;
                    display: block;
                    margin-bottom: 5px;
                }}
                .value {{
                    color: #3B2F2F;
                    padding: 10px;
                    background-color: white;
                    border-left: 3px solid #D9A441;
                    border-radius: 4px;
                }}
                .footer {{
                    text-align: center;
                    margin-top: 20px;
                    padding: 20px;
                    color: #6B4F3F;
                    font-size: 12px;
                }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>THE DIRT PLACE</h1>
                    <p>New Contact Form Submission</p>
                </div>
                <div class="content">
                    <div class="field">
                        <span class="label">Name:</span>
                        <div class="value">{request.name}</div>
                    </div>
                    <div class="field">
                        <span class="label">Phone:</span>
                        <div class="value">{request.phone}</div>
                    </div>
                    <div class="field">
                        <span class="label">Email:</span>
                        <div class="value">{request.email}</div>
                    </div>
                    <div class="field">
                        <span class="label">Material Requested:</span>
                        <div class="value">{request.material if request.material else 'Not specified'}</div>
                    </div>
                    <div class="field">
                        <span class="label">Message:</span>
                        <div class="value">{request.message}</div>
                    </div>
                </div>
                <div class="footer">
                    <p>The Dirt Place | 240 TX-46, Boerne, TX 78006 | (830) 555-0198</p>
                    <p>Serving the Texas Hill Country</p>
                </div>
            </div>
        </body>
        </html>
        """

        # Prepare email parameters
        params = {
            "from": SENDER_EMAIL,
            "to": [BUSINESS_EMAIL],
            "subject": f"New Contact Form Submission - {request.name}",
            "html": html_content,
            "reply_to": request.email
        }

        # Send email asynchronously (non-blocking)
        email_response = await asyncio.to_thread(resend.Emails.send, params)
        
        logger.info(f"Contact form email sent successfully. Email ID: {email_response.get('id')}")

        return {
            "status": "success",
            "message": "Thank you - we'll contact you shortly."
        }

    except Exception as e:
        logger.error(f"Failed to send contact form email: {str(e)}")
        raise HTTPException(
            status_code=500, 
            detail=f"Failed to send message. Please try again or call us at (830) 555-0198."
        )

class CalculatorRequest(BaseModel):
    project_type: str
    length: float
    width: float
    depth: float
    material: str

@router.post("/calculator")
async def calculate_material(request: CalculatorRequest):
    """
    Calculate material quantity based on project dimensions
    """
    try:
        # Calculate volume in cubic feet
        volume_cubic_feet = request.length * request.width * (request.depth / 12)  # depth is in inches
        
        # Convert to cubic yards
        volume_cubic_yards = volume_cubic_feet / 27
        
        # Material-specific calculations and recommendations
        material_info = {
            "Topsoil": {
                "unit": "cubic yards",
                "coverage": volume_cubic_yards,
                "recommendation": "For best results, plan for 3-4 inches of topsoil for garden beds and lawns."
            },
            "Gravel": {
                "unit": "cubic yards",
                "coverage": volume_cubic_yards,
                "recommendation": "Standard gravel driveways need 4-6 inches depth. Pathways need 2-3 inches."
            },
            "Sand": {
                "unit": "cubic yards",
                "coverage": volume_cubic_yards,
                "recommendation": "Sand base layers typically need 2-4 inches depth for proper compaction."
            },
            "Road Base": {
                "unit": "cubic yards",
                "coverage": volume_cubic_yards,
                "recommendation": "Road base requires 4-6 inches depth for driveways and 6-8 inches for heavy use areas."
            },
            "Mulch": {
                "unit": "cubic yards",
                "coverage": volume_cubic_yards,
                "recommendation": "Apply 2-3 inches of mulch for effective weed suppression and moisture retention."
            },
            "Decorative Rock": {
                "unit": "cubic yards",
                "coverage": volume_cubic_yards,
                "recommendation": "Decorative rock looks best at 2-4 inches depth depending on rock size."
            }
        }
        
        material = request.material if request.material in material_info else "Topsoil"
        info = material_info[material]
        
        # Add 10% for waste and settling
        recommended_amount = volume_cubic_yards * 1.1
        
        return {
            "status": "success",
            "project_type": request.project_type,
            "dimensions": {
                "length": request.length,
                "width": request.width,
                "depth": request.depth
            },
            "volume_cubic_feet": round(volume_cubic_feet, 2),
            "volume_cubic_yards": round(volume_cubic_yards, 2),
            "recommended_amount": round(recommended_amount, 2),
            "unit": info["unit"],
            "material": material,
            "recommendation": info["recommendation"],
            "note": "Recommended amount includes 10% extra for settling and waste."
        }
        
    except Exception as e:
        logger.error(f"Calculator error: {str(e)}")
        raise HTTPException(
            status_code=400,
            detail="Invalid calculation parameters. Please check your inputs."
        )
