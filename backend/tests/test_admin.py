"""
Admin Tests for Campus Eats Backend
Tests: Order management, settings, OTP verification
"""
import pytest
from fastapi import status


class TestAdminOrderManagement:
    """Tests for admin order management"""
    
    def test_admin_get_all_orders(self, client, auth_headers_admin):
        """Test admin can get all orders"""
        response = client.get("/admin/orders", headers=auth_headers_admin)
        assert response.status_code == status.HTTP_200_OK
        assert isinstance(response.json(), list)
    
    def test_student_cannot_access_admin_orders(self, client, auth_headers_student):
        """Test student cannot access admin orders endpoint"""
        response = client.get("/admin/orders", headers=auth_headers_student)
        assert response.status_code == status.HTTP_403_FORBIDDEN
    
    def test_admin_update_order_status(self, client, auth_headers_student, auth_headers_admin, sample_menu_item, shop_open):
        """Test admin can update order status"""
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
            json={"order_id": order["id"], "utr": "UTR_STATUS_TEST"}
        )
        
        # Admin verifies payment
        client.post(
            "/payments/verify",
            headers=auth_headers_admin,
            json={"order_id": order["id"], "verified_by": "testadmin"}
        )
        
        # Update status to Preparing
        response = client.patch(
            f"/admin/orders/{order['id']}/status",
            headers=auth_headers_admin,
            json={"status": "Preparing"}
        )
        assert response.status_code == status.HTTP_200_OK
        assert response.json()["status"] == "Preparing"
    
    def test_invalid_status_transition(self, client, auth_headers_student, auth_headers_admin, sample_menu_item, shop_open):
        """Test invalid status transition is rejected"""
        # Create order
        order = client.post(
            "/orders/",
            headers=auth_headers_student,
            json={"items": [{"menu_item_id": sample_menu_item.id, "quantity": 1}]}
        ).json()
        
        # Try to go directly from Pending to Completed (invalid)
        response = client.patch(
            f"/admin/orders/{order['id']}/status",
            headers=auth_headers_admin,
            json={"status": "Completed"}
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST


class TestAdminSettings:
    """Tests for admin settings"""
    
    def test_admin_get_settings(self, client, auth_headers_admin):
        """Test admin can get settings"""
        response = client.get("/admin/settings", headers=auth_headers_admin)
        assert response.status_code == status.HTTP_200_OK
    
    def test_admin_save_setting(self, client, auth_headers_admin):
        """Test admin can save a setting"""
        response = client.post(
            "/admin/settings",
            headers=auth_headers_admin,
            json={
                "key": "test_setting",
                "value": "test_value",
                "category": "test",
                "description": "A test setting"
            }
        )
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["key"] == "test_setting"
        assert data["value"] == "test_value"
    
    def test_student_cannot_access_settings(self, client, auth_headers_student):
        """Test student cannot access admin settings"""
        response = client.get("/admin/settings", headers=auth_headers_student)
        assert response.status_code == status.HTTP_403_FORBIDDEN


class TestOTPVerification:
    """Tests for OTP-based order collection (Fix #1)"""
    
    @pytest.fixture
    def ready_order_with_otp(self, client, auth_headers_student, auth_headers_admin, sample_menu_item, shop_open):
        """Create an order ready for collection with OTP"""
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
            json={"order_id": order["id"], "utr": "UTR_OTP_TEST"}
        )
        
        # Verify payment (generates OTP)
        verify_response = client.post(
            "/payments/verify",
            headers=auth_headers_admin,
            json={"order_id": order["id"], "verified_by": "testadmin"}
        )
        otp = verify_response.json()["otp"]
        
        # Move to Ready status
        client.patch(
            f"/admin/orders/{order['id']}/status",
            headers=auth_headers_admin,
            json={"status": "Preparing"}
        )
        client.patch(
            f"/admin/orders/{order['id']}/status",
            headers=auth_headers_admin,
            json={"status": "Ready"}
        )
        
        return {"order": order, "otp": otp}
    
    def test_verify_valid_otp(self, client, auth_headers_admin, ready_order_with_otp):
        """Test verifying a valid OTP returns order details"""
        response = client.post(
            "/admin/verify-otp",
            headers=auth_headers_admin,
            json={"otp": ready_order_with_otp["otp"]}
        )
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["id"] == ready_order_with_otp["order"]["id"]
    
    def test_verify_invalid_otp(self, client, auth_headers_admin):
        """Test verifying invalid OTP returns 404"""
        response = client.post(
            "/admin/verify-otp",
            headers=auth_headers_admin,
            json={"otp": "000000"}  # Invalid OTP
        )
        assert response.status_code == status.HTTP_404_NOT_FOUND
    
    def test_otp_is_6_digits(self, client, auth_headers_student, auth_headers_admin, sample_menu_item, shop_open):
        """Test OTP generated is exactly 6 digits (Fix #1)"""
        # Create order
        order = client.post(
            "/orders/",
            headers=auth_headers_student,
            json={"items": [{"menu_item_id": sample_menu_item.id, "quantity": 1}]}
        ).json()
        
        # Submit and verify payment
        client.post(
            "/payments/submit",
            headers=auth_headers_student,
            json={"order_id": order["id"], "utr": "UTR_6DIGIT_TEST"}
        )
        
        verify_response = client.post(
            "/payments/verify",
            headers=auth_headers_admin,
            json={"order_id": order["id"], "verified_by": "testadmin"}
        )
        
        otp = verify_response.json()["otp"]
        assert len(otp) == 6
        assert otp.isdigit()


class TestAdminStats:
    """Tests for admin dashboard stats"""
    
    def test_admin_get_stats(self, client, auth_headers_admin):
        """Test admin can get stats"""
        response = client.get("/admin/stats", headers=auth_headers_admin)
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "counts" in data
        assert "revenue" in data
    
    def test_student_cannot_access_stats(self, client, auth_headers_student):
        """Test student cannot access admin stats"""
        response = client.get("/admin/stats", headers=auth_headers_student)
        assert response.status_code == status.HTTP_403_FORBIDDEN
