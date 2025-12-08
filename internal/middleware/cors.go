package middleware

import (
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

// CORS 返回 CORS 中间件配置
// 允许前端跨域访问 API
func CORS() gin.HandlerFunc {
	return cors.New(cors.Config{
		// 允许的来源，生产环境应设置具体域名
		AllowOrigins: []string{"*"},
		// 允许的 HTTP 方法
		AllowMethods: []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		// 允许的请求头
		AllowHeaders: []string{
			"Origin",
			"Content-Type",
			"Accept",
			"Authorization",
			"X-Requested-With",
		},
		// 暴露给客户端的响应头
		ExposeHeaders: []string{
			"Content-Length",
			"Content-Type",
		},
		// 允许携带凭证
		AllowCredentials: true,
		// 预检请求缓存时间
		MaxAge: 12 * time.Hour,
	})
}
