import pytest
from fastapi import status

class TestAuthEndpoints:
    def test_health_check(self, client):
        """Test health check endpoint"""
        response = client.get("/health")
        assert response.status_code == status.HTTP_200_OK
        assert response.json()["status"] == "healthy"
        assert response.json()["service"] == "auth-service"
    
    def test_register_user(self, client):
        """Test user registration"""
        user_data = {
            "email": "newuser@example.com",
            "username": "newuser",
            "password": "Password123!",
            "full_name": "New User"
        }
        
        response = client.post("/register", json=user_data)
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["email"] == user_data["email"]
        assert data["username"] == user_data["username"]
        assert data["full_name"] == user_data["full_name"]
        assert data["is_active"] is True
        assert data["is_verified"] is False
        assert data["role"] == "user"
        assert "id" in data
    
    def test_register_duplicate_user(self, client, test_user):
        """Test registration with existing email/username"""
        user_data = {
            "email": test_user.email,
            "username": "newuser",
            "password": "Password123!"
        }
        
        response = client.post("/register", json=user_data)
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        
        user_data["email"] = "different@example.com"
        user_data["username"] = test_user.username
        
        response = client.post("/register", json=user_data)
        assert response.status_code == status.HTTP_400_BAD_REQUEST
    
    def test_login_success(self, client, test_user):
        """Test successful login"""
        login_data = {
            "email": test_user.email,
            "password": "password"  # Matches the hashed password in the fixture
        }
        
        response = client.post("/login", json=login_data)
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "access_token" in data
        assert "refresh_token" in data
        assert data["token_type"] == "bearer"
        assert data["expires_in"] > 0
    
    def test_login_invalid_credentials(self, client, test_user):
        """Test login with invalid credentials"""
        login_data = {
            "email": test_user.email,
            "password": "wrong-password"
        }
        
        response = client.post("/login", json=login_data)
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
    
    def test_refresh_token(self, client, refresh_token):
        """Test token refresh"""
        refresh_data = {
            "refresh_token": refresh_token
        }
        
        response = client.post("/refresh", json=refresh_data)
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "access_token" in data
        assert "refresh_token" in data
        assert data["token_type"] == "bearer"
        assert data["expires_in"] > 0
    
    def test_refresh_invalid_token(self, client):
        """Test refresh with invalid token"""
        refresh_data = {
            "refresh_token": "invalid-token"
        }
        
        response = client.post("/refresh", json=refresh_data)
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
    
    def test_get_current_user(self, client, access_token):
        """Test getting current user info"""
        response = client.get(
            "/me",
            headers={"Authorization": f"Bearer {access_token}"}
        )
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["email"] == "test@example.com"
        assert data["username"] == "testuser"
    
    def test_verify_token(self, client, access_token):
        """Test token verification"""
        response = client.get(
            "/verify-token",
            headers={"Authorization": f"Bearer {access_token}"}
        )
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["valid"] is True
        assert data["email"] == "test@example.com"
    
    def test_logout(self, client, access_token):
        """Test user logout"""
        response = client.post(
            "/logout",
            headers={"Authorization": f"Bearer {access_token}"}
        )
        
        assert response.status_code == status.HTTP_200_OK
        assert response.json()["message"] == "Successfully logged out"
