from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text, Enum
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from ..database import Base
import enum

class MessageStatus(str, enum.Enum):
    SENT = "sent"
    DELIVERED = "delivered"
    READ = "read"

class Message(Base):
    __tablename__ = "messages"
    
    id = Column(Integer, primary_key=True, index=True)
    sender_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    receiver_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    content = Column(Text, nullable=False)
    attachment_url = Column(String(500), nullable=True)
    attachment_type = Column(String(50), nullable=True)
    attachment_name = Column(String(255), nullable=True)
    status = Column(Enum(MessageStatus), default=MessageStatus.SENT)
    is_read = Column(Boolean, default=False)
    read_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    sender = relationship("User", foreign_keys=[sender_id], backref="sent_messages")
    receiver = relationship("User", foreign_keys=[receiver_id], backref="received_messages")


class Conversation(Base):
    __tablename__ = "conversations"
    
    id = Column(Integer, primary_key=True, index=True)
    buyer_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    seller_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    property_id = Column(Integer, ForeignKey("listings.id"), nullable=True)
    last_message = Column(Text, nullable=True)
    last_message_time = Column(DateTime(timezone=True), server_default=func.now())
    last_message_sender_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    buyer_unread = Column(Integer, default=0)
    seller_unread = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    buyer = relationship("User", foreign_keys=[buyer_id], backref="buyer_conversations")
    seller = relationship("User", foreign_keys=[seller_id], backref="seller_conversations")
    property = relationship("Listing", foreign_keys=[property_id], backref="conversations")