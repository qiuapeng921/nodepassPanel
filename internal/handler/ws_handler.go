package handler

import (
	"nodepassPanel/internal/websocket"

	"github.com/gin-gonic/gin"
)

type WSHandler struct {
	hub *websocket.Hub
}

// Global Hub instance, initialized in main or router?
// Ideally injected.
// var GlobalHub *websocket.Hub // Moved to websocket package

func InitGlobalHub() {
	websocket.GlobalHub = websocket.NewHub()
	go websocket.GlobalHub.Run()
}

func NewWSHandler() *WSHandler {
	if websocket.GlobalHub == nil {
		InitGlobalHub()
	}
	return &WSHandler{hub: websocket.GlobalHub}
}

func (h *WSHandler) Connect(c *gin.Context) {
	// 识别用户
	// 暂时允许公开连接? 或者使用 Query Token?
	// 例如 ?token=...

	// MVP 阶段: 默认加入 Public 房间
	// 如果是管理员: ["public", "admin"]

	rooms := []string{"public"}

	// TODO: 验证 Token 并分配房间

	websocket.ServeWs(h.hub, c, rooms)
}

// PushMessage (Internal API or Debug)
func (h *WSHandler) PushMessage(c *gin.Context) {
	msg := c.Query("msg")
	h.hub.Broadcast([]byte(msg))
	c.String(200, "ok")
}
