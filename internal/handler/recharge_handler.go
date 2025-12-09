package handler

import (
	"net/http"
	"nodepassPanel/internal/middleware"
	"nodepassPanel/internal/service"
	"nodepassPanel/pkg/response"

	"github.com/gin-gonic/gin"
)

// RechargeHandler 充值处理器
type RechargeHandler struct {
	orderService *service.OrderService
}

// NewRechargeHandler 创建充值处理器实例
func NewRechargeHandler() *RechargeHandler {
	return &RechargeHandler{
		orderService: service.NewOrderService(),
	}
}

// CreateOnlineRechargeRequest 在线充值请求
type CreateOnlineRechargeRequest struct {
	Amount float64 `json:"amount" binding:"required,gt=0"` // 充值金额
}

// CreateOnlineRecharge 创建在线充值订单
// @Summary 创建在线充值订单
// @Tags User/Recharge
// @Accept json
// @Param request body CreateOnlineRechargeRequest true "充值金额"
// @Success 200 {object} response.Response
// @Router /api/v1/user/recharge/online [post]
func (h *RechargeHandler) CreateOnlineRecharge(c *gin.Context) {
	userID := middleware.GetUserID(c)
	if userID == 0 {
		response.Error(c, http.StatusUnauthorized, "unauthorized")
		return
	}

	var req CreateOnlineRechargeRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, err.Error())
		return
	}

	// 创建充值订单
	order, err := h.orderService.CreateRechargeOrder(userID, req.Amount)
	if err != nil {
		response.Fail(c, err.Error())
		return
	}

	response.Success(c, gin.H{
		"order_id":  order.ID,
		"order_no":  order.OrderNo,
		"amount":    order.Amount,
		"status":    order.Status,
		"create_at": order.CreatedAt,
	})
}
