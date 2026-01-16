"""
Order Tests for Campus Eats Backend
Tests: Order creation, viewing, authorization (Fix #4)
"""
import pytest
from fastapi import status


class TestOrderCreation:
    """Tests for order creation"""
    
    def test_create_order_success(self, client, auth_headers_student, sample_menu_item, shop_open):
        """Test creating a valid order"""
        response = client.post(
            "/orders/",
            headers=auth_headers_student,
            json={
                "items": [
                    {
                        "menu_item_id": sample_menu_item.id,
                        "quantity": 2
                    }
                ]
            }
        )
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["total_amount"] == 40  # 2 * 20
        assert data["status"] == "Pending"
        assert len(data["items"]) == 1
    
    def test_create_order_empty_cart(self, client, auth_headers_student, shop_open):
        """Test creating order with empty cart fails"""
        response = client.post(
            "/orders/",
            headers=auth_headers_student,
            json={
                "items": []
            }
        )
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
    
    def test_create_order_without_auth(self, client, sample_menu_item):
        """Test creating order without authentication fails"""
        response = client.post(
            "/orders/",
            json={
                "items": [{"menu_item_id": sample_menu_item.id, "quantity": 1}]
            }
        )
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
    
    def test_create_order_invalid_menu_item(self, client, auth_headers_student, shop_open):
        """Test creating order with non-existent menu item fails"""
        response = client.post(
            "/orders/",
            headers=auth_headers_student,
            json={
                "items": [
                    {
                        "menu_item_id": 99999,  # Doesn't exist
                        "quantity": 1
                    }
                ]
            }
        )
        assert response.status_code == status.HTTP_404_NOT_FOUND
    
    def test_create_order_unavailable_item(self, client, auth_headers_student, db, sample_menu_item, shop_open):
        """Test creating order with unavailable item fails"""
        # Mark item as unavailable
        sample_menu_item.is_available = False
        db.commit()
        
        response = client.post(
            "/orders/",
            headers=auth_headers_student,
            json={
                "items": [
                    {
                        "menu_item_id": sample_menu_item.id,
                        "quantity": 1
                    }
                ]
            }
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST
    
    def test_create_order_exceeds_max_quantity(self, client, auth_headers_student, sample_menu_item, shop_open):
        """Test order with quantity exceeding limit fails"""
        response = client.post(
            "/orders/",
            headers=auth_headers_student,
            json={
                "items": [
                    {
                        "menu_item_id": sample_menu_item.id,
                        "quantity": 51  # Exceeds max 50
                    }
                ]
            }
        )
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY


class TestOrderViewing:
    """Tests for order viewing and authorization (Fix #4)"""
    
    def test_get_own_order(self, client, auth_headers_student, sample_menu_item, shop_open):
        """Test student can view their own order"""
        # Create order
        create_response = client.post(
            "/orders/",
            headers=auth_headers_student,
            json={
                "items": [{"menu_item_id": sample_menu_item.id, "quantity": 1}]
            }
        )
        order_id = create_response.json()["id"]
        
        # Get order
        response = client.get(f"/orders/{order_id}", headers=auth_headers_student)
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["id"] == order_id
    
    def test_cannot_view_other_student_order(self, client, auth_headers_student, sample_menu_item, db, shop_open):
        """Test student cannot view another student's order (Fix #4)"""
        from db import models
        from core.auth import get_password_hash
        
        # Create order as first student
        create_response = client.post(
            "/orders/",
            headers=auth_headers_student,
            json={
                "items": [{"menu_item_id": sample_menu_item.id, "quantity": 1}]
            }
        )
        order_id = create_response.json()["id"]
        
        # Create another student
        other_student = models.User(
            username="otherstudent",
            email="other@test.com",
            hashed_password=get_password_hash("password123"),
            role="student",
            is_active=True
        )
        db.add(other_student)
        db.commit()
        
        # Login as other student
        login_response = client.post(
            "/token",
            data={"username": "otherstudent", "password": "password123"}
        )
        other_token = login_response.json()["access_token"]
        other_headers = {"Authorization": f"Bearer {other_token}"}
        
        # Try to view first student's order
        response = client.get(f"/orders/{order_id}", headers=other_headers)
        assert response.status_code == status.HTTP_403_FORBIDDEN
    
    def test_admin_can_view_any_order(self, client, auth_headers_student, auth_headers_admin, sample_menu_item, shop_open):
        """Test admin can view any student's order"""
        # Create order as student
        create_response = client.post(
            "/orders/",
            headers=auth_headers_student,
            json={
                "items": [{"menu_item_id": sample_menu_item.id, "quantity": 1}]
            }
        )
        order_id = create_response.json()["id"]
        
        # View as admin
        response = client.get(f"/orders/{order_id}", headers=auth_headers_admin)
        assert response.status_code == status.HTTP_200_OK
    
    def test_get_my_orders_only_returns_own(self, client, auth_headers_student, sample_menu_item, db, shop_open):
        """Test /orders/ only returns user's own orders"""
        from db import models
        from core.auth import get_password_hash
        
        # Create order as first student
        client.post(
            "/orders/",
            headers=auth_headers_student,
            json={
                "items": [{"menu_item_id": sample_menu_item.id, "quantity": 1}]
            }
        )
        
        # Create another student and their order
        other_student = models.User(
            username="otherstudent2",
            email="other2@test.com",
            hashed_password=get_password_hash("password123"),
            role="student",
            is_active=True
        )
        db.add(other_student)
        db.commit()
        
        login_response = client.post(
            "/token",
            data={"username": "otherstudent2", "password": "password123"}
        )
        other_token = login_response.json()["access_token"]
        other_headers = {"Authorization": f"Bearer {other_token}"}
        
        client.post(
            "/orders/",
            headers=other_headers,
            json={
                "items": [{"menu_item_id": sample_menu_item.id, "quantity": 2}]
            }
        )
        
        # Get orders as first student - should only see 1
        response = client.get("/orders/", headers=auth_headers_student)
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert len(data) == 1  # Only their own order
    
    def test_get_nonexistent_order(self, client, auth_headers_student):
        """Test getting non-existent order returns 404"""
        response = client.get("/orders/99999", headers=auth_headers_student)
        assert response.status_code == status.HTTP_404_NOT_FOUND
