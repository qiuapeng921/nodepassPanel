package middleware

import (
	"bytes"
	"io"
	"nodepassPanel/pkg/logger"
	"time"

	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
)

// responseWriter 包装 gin.ResponseWriter 以捕获响应状态码
type responseWriter struct {
	gin.ResponseWriter
	statusCode int
}

func (rw *responseWriter) WriteHeader(code int) {
	rw.statusCode = code
	rw.ResponseWriter.WriteHeader(code)
}

// RequestLogger 请求日志中间件
// 记录请求详情和响应时间
func RequestLogger() gin.HandlerFunc {
	return func(c *gin.Context) {
		// 开始时间
		startTime := time.Now()

		// 请求路径
		path := c.Request.URL.Path
		query := c.Request.URL.RawQuery

		// 请求体（仅在非生产环境记录，且限制大小）
		var requestBody string
		if c.Request.Body != nil && c.Request.ContentLength < 10240 { // 限制 10KB
			bodyBytes, _ := io.ReadAll(c.Request.Body)
			c.Request.Body = io.NopCloser(bytes.NewBuffer(bodyBytes))
			requestBody = string(bodyBytes)
		}

		// 包装 ResponseWriter
		rw := &responseWriter{
			ResponseWriter: c.Writer,
			statusCode:     200,
		}
		c.Writer = rw

		// 处理请求
		c.Next()

		// 计算耗时
		latency := time.Since(startTime)

		// 构建日志字段
		fields := []zap.Field{
			zap.String("method", c.Request.Method),
			zap.String("path", path),
			zap.String("query", query),
			zap.Int("status", rw.statusCode),
			zap.Duration("latency", latency),
			zap.String("ip", c.ClientIP()),
			zap.String("user-agent", c.Request.UserAgent()),
		}

		// 如果有用户 ID，添加到日志
		if userID := GetUserID(c); userID > 0 {
			fields = append(fields, zap.Uint("user_id", userID))
		}

		// 根据状态码选择日志级别
		switch {
		case rw.statusCode >= 500:
			fields = append(fields, zap.String("request_body", requestBody))
			logger.Log.Error("Server error", fields...)
		case rw.statusCode >= 400:
			fields = append(fields, zap.String("request_body", requestBody))
			logger.Log.Warn("Client error", fields...)
		case rw.statusCode >= 300:
			logger.Log.Info("Redirect", fields...)
		default:
			logger.Log.Debug("Request completed", fields...)
		}
	}
}
