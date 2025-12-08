package middleware

import (
	"net/http"
	"nodepassPanel/pkg/response"

	"github.com/gin-gonic/gin"
	"golang.org/x/time/rate"
)

// RateLimiter 请求限流中间件
// limiter: 限流器实例
func RateLimiter(limiter *rate.Limiter) gin.HandlerFunc {
	return func(c *gin.Context) {
		if !limiter.Allow() {
			response.Error(c, http.StatusTooManyRequests, "too many requests, please try again later")
			c.Abort()
			return
		}
		c.Next()
	}
}

// NewRateLimiter 创建新的限流器
// r: 每秒允许的请求数
// b: 令牌桶大小（突发量）
func NewRateLimiter(r rate.Limit, b int) *rate.Limiter {
	return rate.NewLimiter(r, b)
}
