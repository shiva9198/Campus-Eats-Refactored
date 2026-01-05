from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
import models, database

router = APIRouter(
    prefix="/payments",
    tags=["payments"],
)

class PaymentSubmit(BaseModel):
    order_id: int
    reference: str = "Manual Proof"

@router.post("/submit")
def submit_payment(payment: PaymentSubmit, db: Session = Depends(database.get_db)):
    order = db.query(models.Order).filter(models.Order.id == payment.order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    # Secure Rule: Student cannot change status. Only flag that they paid.
    order.payment_submitted = True
    db.commit()
    return {"message": "Payment submitted for verification", "status": order.status}
