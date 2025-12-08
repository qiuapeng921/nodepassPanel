package handler

import (
	"net/http"
	"nodepassPanel/internal/service"

	"github.com/gin-gonic/gin"
)

// SubscribeHandler 订阅处理器
type SubscribeHandler struct {
	subService *service.SubscribeService
}

// NewSubscribeHandler 创建订阅处理器实例
func NewSubscribeHandler() *SubscribeHandler {
	return &SubscribeHandler{
		subService: service.NewSubscribeService(),
	}
}

// Subscribe 获取订阅配置
// @Summary 获取订阅配置
// @Description 根据用户 UUID Token 获取订阅链接，支持多种客户端格式
// @Tags Subscribe
// @Produce plain
// @Param token path string true "用户订阅 Token (UUID)"
// @Success 200 {string} string "订阅配置内容"
// @Failure 400 {string} string "缺少 Token"
// @Failure 404 {string} string "用户不存在"
// @Router /client/subscribe/{token} [get]
func (h *SubscribeHandler) Subscribe(c *gin.Context) {
	token := c.Param("token")
	if token == "" {
		c.String(http.StatusBadRequest, "missing token")
		return
	}

	userAgent := c.GetHeader("User-Agent")

	content, err := h.subService.GetUserSubscribe(token, userAgent)
	if err != nil {
		c.String(http.StatusNotFound, err.Error())
		return
	}

	c.String(http.StatusOK, content)
}
