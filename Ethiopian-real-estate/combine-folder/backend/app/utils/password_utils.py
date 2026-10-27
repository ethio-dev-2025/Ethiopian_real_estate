import hashlib
import bcrypt
from typing import Tuple

class PasswordHandler:
    """Handle passwords safely with bcrypt's 72-byte limit"""
    
    @staticmethod
    def prepare_password(password: str) -> str:
        """
        Prepare password for bcrypt by ensuring it's under 72 bytes.
        Uses SHA-256 for long passwords to maintain security.
        """
        if not password:
            return ""
        
        # Convert to bytes
        password_bytes = password.encode('utf-8')
        
        # If password is within bcrypt limit, use it directly
        if len(password_bytes) <= 72:
            return password
        
        # For long passwords, hash them first to get a fixed length
        # This maintains security while respecting bcrypt's limit
        hashed = hashlib.sha256(password_bytes).digest()
        # Convert to base64 for safe storage (produces ~44 chars, well under 72)
        import base64
        return base64.b64encode(hashed).decode('ascii')
    
    @staticmethod
    def hash_password(password: str) -> str:
        """Hash password safely, handling long passwords"""
        if not password:
            raise ValueError("Password cannot be empty")
        
        # Prepare password for bcrypt
        prepared = PasswordHandler.prepare_password(password)
        
        # Hash using bcrypt
        salt = bcrypt.gensalt()
        hashed = bcrypt.hashpw(prepared.encode('utf-8'), salt)
        return hashed.decode('utf-8')
    
    @staticmethod
    def verify_password(password: str, hashed: str) -> bool:
        """Verify password against hash, handling long passwords"""
        if not password or not hashed:
            return False
        
        # Prepare password the same way as when hashing
        prepared = PasswordHandler.prepare_password(password)
        
        # Verify
        try:
            return bcrypt.checkpw(
                prepared.encode('utf-8'),
                hashed.encode('utf-8')
            )
        except Exception:
            return False
