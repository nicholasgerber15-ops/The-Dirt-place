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

class EmailCalculationRequest(BaseModel):
    email: EmailStr
    calculation: dict

@router.post("/calculator")
async def calculate_material(request: CalculatorRequest):
    """
    Calculate material quantity based on project dimensions
    """
    try:
        # Validate positive dimensions
        if request.length <= 0 or request.width <= 0 or request.depth <= 0:
            raise HTTPException(
                status_code=400,
                detail="All dimensions must be positive numbers greater than zero."
            )
        
        # Calculate volume in cubic feet
        volume_cubic_feet = request.length * request.width * (request.depth / 12)  # depth is in inches
        
        # Convert to cubic yards and round up to nearest half yard
        import math
        volume_cubic_yards = math.ceil((volume_cubic_feet / 27) * 2) / 2
        
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

@router.post("/email-calculation")
async def email_calculation(request: EmailCalculationRequest):
    """
    Email calculation results to user
    """
    try:
        calc = request.calculation
        
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
                    background: linear-gradient(135deg, #3B2F2F 0%, #6B4F3F 100%);
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
                    font-size: 16px;
                }}
                .content {{
                    background-color: #FAF9F6;
                    padding: 30px;
                    border: 2px solid #6B4F3F;
                    border-top: none;
                }}
                .result-box {{
                    background-color: white;
                    padding: 20px;
                    margin: 15px 0;
                    border-left: 4px solid #D9A441;
                    border-radius: 4px;
                }}
                .highlight {{
                    background-color: #D9A441;
                    color: #3B2F2F;
                    padding: 20px;
                    margin: 20px 0;
                    border-radius: 8px;
                    text-align: center;
                }}
                .highlight h2 {{
                    margin: 0 0 10px 0;
                    font-size: 24px;
                }}
                .highlight p {{
                    margin: 0;
                    font-size: 32px;
                    font-weight: bold;
                }}
                .recommendation {{
                    background-color: #6B7A3A;
                    color: white;
                    padding: 15px;
                    margin: 20px 0;
                    border-radius: 8px;
                }}
                .footer {{
                    text-align: center;
                    margin-top: 30px;
                    padding: 20px;
                    color: #6B4F3F;
                    font-size: 12px;
                    border-top: 2px solid #D9A441;
                }}
                .cta-button {{
                    display: inline-block;
                    background-color: #3B2F2F;
                    color: white;
                    padding: 15px 30px;
                    text-decoration: none;
                    border-radius: 5px;
                    margin: 20px 0;
                    font-weight: bold;
                }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>THE DIRT PLACE</h1>
                    <p>Your Material Calculation Results</p>
                </div>
                <div class="content">
                    <h2 style="color: #3B2F2F; margin-bottom: 20px;">Project Details</h2>
                    
                    <div class="result-box">
                        <strong>Project Type:</strong> {calc['project_type']}
                    </div>
                    
                    <div class="result-box">
                        <strong>Dimensions:</strong><br>
                        Length: {calc['dimensions']['length']}' × Width: {calc['dimensions']['width']}' × Depth: {calc['dimensions']['depth']}"
                    </div>
                    
                    <div class="result-box">
                        <strong>Material:</strong> {calc['material']}
                    </div>
                    
                    <div class="result-box">
                        <strong>Total Volume:</strong> {calc['volume_cubic_yards']} cubic yards
                    </div>
                    
                    <div class="highlight">
                        <h2>Recommended Amount</h2>
                        <p>{calc['recommended_amount']} {calc['unit']}</p>
                        <small style="font-size: 14px;">Includes 10% extra for settling and waste</small>
                    </div>
                    
                    <div class="recommendation">
                        <strong>💡 Professional Tip:</strong><br>
                        {calc['recommendation']}
                    </div>
                    
                    <div style="text-align: center;">
                        <p style="font-size: 18px; color: #3B2F2F; margin-bottom: 10px;">
                            Ready to order?
                        </p>
                        <a href="https://earth-supply-1.preview.emergentagent.com/contact" class="cta-button">
                            Request a Quote
                        </a>
                    </div>
                </div>
                <div class="footer">
                    <p><strong>The Dirt Place</strong></p>
                    <p>240 TX-46, Boerne, TX 78006</p>
                    <p>Phone: (830) 555-0198 | Email: info@thedirtplace.com</p>
                    <p style="margin-top: 15px;">Serving the Texas Hill Country with quality materials since 2010</p>
                </div>
            </div>
        </body>
        </html>
        """

        # Prepare email parameters
        params = {
            "from": SENDER_EMAIL,
            "to": [request.email],
            "subject": f"Your Material Calculation - {calc['material']} for {calc['project_type']}",
            "html": html_content
        }

        # Send email asynchronously
        email_response = await asyncio.to_thread(resend.Emails.send, params)
        
        logger.info(f"Calculation email sent successfully to {request.email}. Email ID: {email_response.get('id')}")

        return {
            "status": "success",
            "message": f"Calculation results sent to {request.email}"
        }

    except Exception as e:
        logger.error(f"Failed to send calculation email: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Failed to send email. Please try again."
        )
