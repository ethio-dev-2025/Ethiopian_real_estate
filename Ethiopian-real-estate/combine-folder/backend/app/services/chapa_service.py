import httpx
import time
import random
import string
import re
from typing import Optional, Dict, Any, List
from ..config import settings

class ChapaService:
    def __init__(self):
        self.secret_key = settings.CHAPA_SECRET_KEY
        self.base_url = settings.CHAPA_BASE_URL
        self.headers = {
            "Authorization": f"Bearer {self.secret_key}",
            "Content-Type": "application/json"
        }
    
    def generate_transaction_ref(self, prefix: str = "tx") -> str:
        """Generate unique transaction reference"""
        timestamp = int(time.time() * 1000)
        random_suffix = ''.join(random.choices(string.ascii_lowercase + string.digits, k=10))
        return f"{prefix}-{timestamp}-{random_suffix}"
    
    def validate_phone_number(self, phone: str) -> str:
        """Validate and format Ethiopian phone number"""
        if not phone:
            return "0911111111"
        phone = re.sub(r'\D', '', phone)
        if phone.startswith('251'):
            phone = '0' + phone[3:]
        if len(phone) == 9:
            phone = '0' + phone
        if len(phone) != 10 or not phone.startswith('0'):
            return "0911111111"
        return phone
    
    async def initialize_payment(
        self,
        amount: float,
        email: str,
        first_name: str,
        last_name: str,
        phone: str,
        plan_type: str,
        user_id: int,
        tx_ref: Optional[str] = None
    ) -> Dict[str, Any]:
        """Initialize payment with Chapa"""
        
        if not tx_ref:
            tx_ref = self.generate_transaction_ref(f"{plan_type}-{user_id}")
        
        phone = self.validate_phone_number(phone)
        
        payment_data = {
            "amount": str(amount),
            "currency": "ETB",
            "email": email,
            "first_name": first_name[:50],
            "last_name": last_name[:50],
            "phone_number": phone,
            "tx_ref": tx_ref,
            "title": f"RealEstate Pro - {plan_type.title()} Plan",
            "description": f"Monthly subscription for {plan_type} account - ${amount}",
            "callback_url": f"{settings.BASE_URL}/api/payments/webhook",
            "return_url": f"{settings.FRONTEND_URL}/payment/success?plan={plan_type}",
            "meta": {
                "plan_type": plan_type,
                "user_id": user_id,
                "amount": amount
            }
        }
        
        print(f"Chapa Request: {payment_data}")
        
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    f"{self.base_url}/transaction/initialize",
                    json=payment_data,
                    headers=self.headers
                )
                
                if response.status_code == 200:
                    result = response.json()
                    if result.get("status") == "success" and result.get("data", {}).get("checkout_url"):
                        # Store transaction in database (optional)
                        return {
                            "success": True,
                            "checkout_url": result["data"]["checkout_url"],
                            "tx_ref": tx_ref
                        }
                    else:
                        return {"success": False, "error": result.get("message", "Payment failed")}
                else:
                    return {"success": False, "error": f"HTTP {response.status_code}"}
                    
        except Exception as e:
            print(f"Chapa error: {e}")
            return {"success": False, "error": str(e)}
    
    async def verify_payment(self, tx_ref: str) -> Dict[str, Any]:
        """Verify payment status with Chapa"""
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.get(
                    f"{self.base_url}/transaction/verify/{tx_ref}",
                    headers=self.headers
                )
                
                if response.status_code == 200:
                    result = response.json()
                    if result.get("status") == "success":
                        data = result.get("data", {})
                        return {
                            "success": True,
                            "verified": True,
                            "amount": data.get("amount"),
                            "currency": data.get("currency"),
                            "status": data.get("status")
                        }
                return {"success": False, "verified": False}
                    
        except Exception as e:
            print(f"Verification error: {e}")
            return {"success": False, "verified": False}


chapa_service = ChapaService()