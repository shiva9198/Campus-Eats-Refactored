"""
Authentication Tests for Campus Eats Backend
Tests: Registration, Login, Role enforcement, Password validation
"""
import pytest
from fastapi import status


class TestRegistration:
    """Tests for user registration endpoint"""
    
    def test_register_new_user(self, client):
        """Test successful user registration"""
        response = client.post(
            "/register",
            json={
                "username": "newuser",
                "email": "new@test.com",
                "password": "password123"
            }
        )
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["username"] == "newuser"
        assert data["email"] == "new@test.com"
        assert data["role"] == "student"  # Should force student role
        assert "password" not in data  # Should not return password
        assert "hashed_password" not in data
    
    def test_register_duplicate_username(self, client, test_student):
        """Test registration with duplicate username fails"""
        response = client.post(
            "/register",
            json={
                "username": "teststudent",  # Already exists
                "email": "different@test.com",
                "password": "password123"
            }
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST
    
    def test_register_weak_password(self, client):
        """Test registration with password shorter than 8 chars fails (Fix #6)"""
        response = client.post(
            "/register",
            json={
                "username": "weakpass",
                "email": "weak@test.com",
                "password": "123"  # Too short - less than 8 chars
            }
        )
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
    
    def test_register_password_exactly_8_chars(self, client):
        """Test registration with exactly 8 character password succeeds"""
        response = client.post(
            "/register",
            json={
                "username": "exact8user",
                "email": "exact8@test.com",
                "password": "12345678"  # Exactly 8 chars
            }
        )
        assert response.status_code == status.HTTP_200_OK
    
    def test_register_forces_student_role(self, client):
        """Test that registration always creates student role (Fix #3)"""
        response = client.post(
            "/register",
            json={
                "username": "hacker",
                "email": "hacker@test.com",
                "password": "password123",
                "role": "admin"  # Attempt to inject admin role
            }
        )
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["role"] == "student"  # Must be forced to student


class TestLogin:
    """Tests for user login endpoint"""
    
    def test_login_success(self, client, test_student):
        """Test successful login returns access token"""
        response = client.post(
            "/token",
            data={
                "username": "teststudent",
                "password": "password123"
            }
        )
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"
    
    def test_login_wrong_password(self, client, test_student):
        """Test login with wrong password fails"""
        response = client.post(
            "/token",
            data={
                "username": "teststudent",
                "password": "wrongpassword"
            }
        )
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
    
    def test_login_nonexistent_user(self, client):
        """Test login with non-existent user fails"""
        response = client.post(
            "/token",
            data={
                "username": "doesnotexist",
                "password": "password123"
            }
        )
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
    
    def test_login_empty_username(self, client):
        """Test login with empty username fails"""
        response = client.post(
            "/token",
            data={
                "username": "",
                "password": "password123"
            }
        )
        # FastAPI OAuth2 form might return 422 or 401
        assert response.status_code in [status.HTTP_401_UNAUTHORIZED, status.HTTP_422_UNPROCESSABLE_ENTITY]
    
    def test_login_empty_password(self, client, test_student):
        """Test login with empty password fails"""
        response = client.post(
            "/token",
            data={
                "username": "teststudent",
                "password": ""
            }
        )
        assert response.status_code == status.HTTP_401_UNAUTHORIZED


class TestProtectedRoutes:
    """Tests for accessing protected routes"""
    
    def test_access_protected_route_without_token(self, client):
        """Test accessing protected route without token fails"""
        response = client.get("/orders/")
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
    
    def test_access_protected_route_with_invalid_token(self, client):
        """Test accessing protected route with invalid token fails"""
        response = client.get(
            "/orders/",
            headers={"Authorization": "Bearer invalid_token_here"}
        )
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
    
    def test_access_student_route_with_valid_token(self, client, auth_headers_student):
        """Test accessing protected student route with valid token succeeds"""
        response = client.get("/orders/", headers=auth_headers_student)
        assert response.status_code == status.HTTP_200_OK
    
    def test_access_admin_route_as_student_fails(self, client, auth_headers_student):
        """Test student cannot access admin-only routes"""
        response = client.get("/admin/orders", headers=auth_headers_student)
        assert response.status_code == status.HTTP_403_FORBIDDEN
    
    def test_access_admin_route_as_admin(self, client, auth_headers_admin):
        """Test admin can access admin-only routes"""
        response = client.get("/admin/orders", headers=auth_headers_admin)
        assert response.status_code == status.HTTP_200_OK
