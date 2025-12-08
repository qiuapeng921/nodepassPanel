package middleware

import (
	"net/http"
	"nodepassPanel/pkg/response"
	"nodepassPanel/pkg/utils"
	"strings"

	"github.com/gin-gonic/gin"
)

// 上下文键名常量
const (
	ContextKeyUserID  = "user_id"
	ContextKeyEmail   = "email"
	ContextKeyRole    = "role"
	ContextKeyIsAdmin = "is_admin"
)

// JWTAuth JWT 认证中间件
// 验证请求头中的 Authorization Bearer Token
func JWTAuth() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			response.Error(c, http.StatusUnauthorized, "missing authorization header")
			c.Abort()
			return
		}

		// 解析 Bearer Token
		parts := strings.SplitN(authHeader, " ", 2)
		if len(parts) != 2 || strings.ToLower(parts[0]) != "bearer" {
			response.Error(c, http.StatusUnauthorized, "invalid authorization format")
			c.Abort()
			return
		}

		tokenString := parts[1]
		claims, err := utils.ParseToken(tokenString)
		if err != nil {
			response.Error(c, http.StatusUnauthorized, "invalid or expired token")
			c.Abort()
			return
		}

		// 将用户信息注入上下文
		c.Set(ContextKeyUserID, claims.UserID)
		c.Set(ContextKeyEmail, claims.Email)
		c.Set(ContextKeyRole, claims.Role)
		c.Set(ContextKeyIsAdmin, claims.Role == "admin")

		c.Next()
	}
}

// AdminRequired 管理员权限检查中间件
// 必须在 JWTAuth 之后使用
func AdminRequired() gin.HandlerFunc {
	return func(c *gin.Context) {
		isAdmin, exists := c.Get(ContextKeyIsAdmin)
		if !exists || !isAdmin.(bool) {
			response.Error(c, http.StatusForbidden, "admin access required")
			c.Abort()
			return
		}
		c.Next()
	}
}

// GetUserID 从上下文获取用户ID
func GetUserID(c *gin.Context) uint {
	if userID, exists := c.Get(ContextKeyUserID); exists {
		return userID.(uint)
	}
	return 0
}

// GetUserEmail 从上下文获取用户邮箱
func GetUserEmail(c *gin.Context) string {
	if email, exists := c.Get(ContextKeyEmail); exists {
		return email.(string)
	}
	return ""
}

// IsAdmin 检查当前用户是否为管理员
func IsAdmin(c *gin.Context) bool {
	if isAdmin, exists := c.Get(ContextKeyIsAdmin); exists {
		return isAdmin.(bool)
	}
	return false
}
