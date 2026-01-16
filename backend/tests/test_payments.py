"""
Payment Tests for Campus Eats Backend
Tests: Payment submission, authorization (Fix #5), duplicate UTR prevention
"""
import pytest
from fastapi import status


class TestPaymentSubmission:
    """Tests for payment submission"""
    
    @pytest.fixture
    def pending_order(self, client, auth_headers_student, sample_menu_item, shop_open):
        """Create a pending order for testing"""
        response = client.post(
            "/orders/",
            headers=auth_headers_student,
            json={
                "items": [{"menu_item_id": sample_menu_item.id, "quantity": 1}]
            }
        )
        return response.json()
    
    def test_submit_payment(self, client, auth_headers_student, pending_order):
        """Test submitting payment proof"""
        response = client.post(
            "/payments/submit",
            headers=auth_headers_student,
            json={
                "order_id": pending_order["id"],
                "utr": "UTR123456789"  # Align with our schema
            }
        )
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["status"] == "Pending_Verification"
    
    def test_submit_payment_for_other_user_order(self, client, auth_headers_student, pending_order, db):
        """Test cannot submit payment for another user's order (Fix #5)"""
        from db import models
        from core.auth import get_password_hash
        
        # Create another student
        other_student = models.User(
            username="paymentother",
            email="payother@test.com",
            hashed_password=get_password_hash("password123"),
            role="student",
            is_active=True
        )
        db.add(other_student)
        db.commit()
        
        # Login as other student
        login_response = client.post(
            "/token",
            data={"username": "paymentother", "password": "password123"}
        )
        other_token = login_response.json()["access_token"]
        other_headers = {"Authorization": f"Bearer {other_token}"}
        
        # Try to submit payment for first student's order
        response = client.post(
            "/payments/submit",
            headers=other_headers,
            json={
                "order_id": pending_order["id"],
                "utr": "UTR123456789"
            }
        )
        assert response.status_code == status.HTTP_403_FORBIDDEN
    
    def test_submit_payment_without_auth(self, client, pending_order):
        """Test cannot submit payment without authentication"""
        response = client.post(
            "/payments/submit",
            json={
                "order_id": pending_order["id"],
                "utr": "UTR123456789"
            }
        )
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
    
    def test_submit_duplicate_utr(self, client, auth_headers_student, sample_menu_item, shop_open):
        """Test cannot submit same UTR twice"""
        # Create two orders
        order1 = client.post(
            "/orders/",
            headers=auth_headers_student,
            json={"items": [{"menu_item_id": sample_menu_item.id, "quantity": 1}]}
        ).json()
        
        order2 = client.post(
            "/orders/",
            headers=auth_headers_student,
            json={"items": [{"menu_item_id": sample_menu_item.id, "quantity": 1}]}
        ).json()
        
        # Submit payment for first order
        client.post(
            "/payments/submit",
            headers=auth_headers_student,
            json={
                "order_id": order1["id"],
                "utr": "UTR_UNIQUE_12345"
            }
        )
        
        # Try to use same UTR for second order
        response = client.post(
            "/payments/submit",
            headers=auth_headers_student,
            json={
                "order_id": order2["id"],
                "utr": "UTR_UNIQUE_12345"  # Duplicate
            }
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST
    
    def test_submit_payment_short_utr(self, client, auth_headers_student, pending_order):
        """Test cannot submit UTR shorter than 4 chars"""
        response = client.post(
            "/payments/submit",
            headers=auth_headers_student,
            json={
                "order_id": pending_order["id"],
                "utr": "123"  # Too short
            }
        )
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
    
    def test_submit_payment_nonexistent_order(self, client, auth_headers_student):
        """Test cannot submit payment for non-existent order"""
        response = client.post(
            "/payments/submit",
            headers=auth_headers_student,
            json={
                "order_id": 99999,
                "utr": "UTR123456789"
            }
        )
        assert response.status_code == status.HTTP_404_NOT_FOUND


class TestPaymentVerification:
    """Tests for admin payment verification"""
    
    @pytest.fixture
    def pending_verification_order(self, client, auth_headers_student, sample_menu_item, shop_open):
        """Create an order pending verification"""
        # Create order
        order = client.post(
            "/orders/",
            headers=auth_headers_student,
            json={"items": [{"menu_item_id": sample_menu_item.id, "quantity": 1}]}
        ).json()
        
        # Submit payment
        client.post(
            "/payments/submit",
            headers=auth_headers_student,
            json={"order_id": order["id"], "utr": "UTR_TEST_123"}
        )
        
        return order
    
    def test_admin_verify_payment(self, client, auth_headers_admin, pending_verification_order):
        """Test admin can verify payment and OTP is generated"""
        response = client.post(
            "/payments/verify",
            headers=auth_headers_admin,
            json={
                "order_id": pending_verification_order["id"],
                "verified_by": "testadmin"
            }
        )
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["status"] == "Paid"
        assert "otp" in data
        assert len(data["otp"]) == 6  # Fix #1: OTP is 6 digits
    
    def test_student_cannot_verify_payment(self, client, auth_headers_student, pending_verification_order):
        """Test student cannot verify payment (admin only)"""
        response = client.post(
            "/payments/verify",
            headers=auth_headers_student,
            json={
                "order_id": pending_verification_order["id"],
                "verified_by": "student"
            }
        )
        assert response.status_code == status.HTTP_403_FORBIDDEN
    
    def test_admin_reject_payment(self, client, auth_headers_admin, pending_verification_order):
        """Test admin can reject payment"""
        response = client.post(
            "/payments/reject",
            headers=auth_headers_admin,
            json={
                "order_id": pending_verification_order["id"],
                "rejected_by": "testadmin",
                "reason": "UTR not found in bank statement"
            }
        )
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["status"] == "Payment_Rejected"
