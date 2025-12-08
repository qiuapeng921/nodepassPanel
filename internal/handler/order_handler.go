package handler

import (
	"net/http"
	"nodepassPanel/internal/middleware"
	"nodepassPanel/internal/service"
	"nodepassPanel/pkg/response"
	"strconv"

	"github.com/gin-gonic/gin"
)

// OrderHandler 订单处理器
type OrderHandler struct {
	orderService *service.OrderService
}

// NewOrderHandler 创建订单处理器实例
func NewOrderHandler() *OrderHandler {
	return &OrderHandler{
		orderService: service.NewOrderService(),
	}
}

// ==================== 用户端接口 ====================

// Create 创建订单
// @Summary 创建订单
// @Tags Order
// @Accept json
// @Param request body service.CreateOrderRequest true "订单信息"
// @Success 200 {object} response.Response
// @Router /api/v1/user/orders [post]
func (h *OrderHandler) Create(c *gin.Context) {
	userID := middleware.GetUserID(c)
	if userID == 0 {
		response.Error(c, http.StatusUnauthorized, "unauthorized")
		return
	}

	var req service.CreateOrderRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, err.Error())
		return
	}

	order, err := h.orderService.Create(userID, &req)
	if err != nil {
		response.Fail(c, err.Error())
		return
	}

	response.Success(c, order)
}

// List 获取我的订单
// @Summary 获取我的订单列表
// @Tags Order
// @Success 200 {object} response.Response
// @Router /api/v1/user/orders [get]
func (h *OrderHandler) List(c *gin.Context) {
	userID := middleware.GetUserID(c)
	if userID == 0 {
		response.Error(c, http.StatusUnauthorized, "unauthorized")
		return
	}

	orders, err := h.orderService.GetUserOrders(userID)
	if err != nil {
		response.Fail(c, err.Error())
		return
	}

	response.Success(c, orders)
}

// Get 获取订单详情
// @Summary 获取订单详情
// @Tags Order
// @Param id path int true "订单ID"
// @Success 200 {object} response.Response
// @Router /api/v1/user/orders/{id} [get]
func (h *OrderHandler) Get(c *gin.Context) {
	userID := middleware.GetUserID(c)
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		response.Error(c, http.StatusBadRequest, "invalid order id")
		return
	}

	order, err := h.orderService.GetByID(uint(id))
	if err != nil {
		response.Error(c, http.StatusNotFound, "order not found")
		return
	}

	// 检查权限
	if order.UserID != userID && !middleware.IsAdmin(c) {
		response.Error(c, http.StatusForbidden, "permission denied")
		return
	}

	response.Success(c, order)
}

// Cancel 取消订单
// @Summary 取消订单
// @Tags Order
// @Param id path int true "订单ID"
// @Success 200 {object} response.Response
// @Router /api/v1/user/orders/{id}/cancel [post]
func (h *OrderHandler) Cancel(c *gin.Context) {
	userID := middleware.GetUserID(c)
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		response.Error(c, http.StatusBadRequest, "invalid order id")
		return
	}

	if err := h.orderService.Cancel(uint(id), userID); err != nil {
		response.Fail(c, err.Error())
		return
	}

	response.Success(c, nil)
}

// ==================== 管理员接口 ====================

// AdminList 获取订单列表
// @Summary 获取订单列表（管理员）
// @Tags Admin/Order
// @Param page query int false "页码"
// @Param page_size query int false "每页数量"
// @Param status query int false "订单状态"
// @Param user_id query int false "用户ID"
// @Success 200 {object} response.Response
// @Router /api/v1/admin/orders [get]
func (h *OrderHandler) AdminList(c *gin.Context) {
	var query service.OrderListQuery
	if err := c.ShouldBindQuery(&query); err != nil {
		response.Error(c, http.StatusBadRequest, err.Error())
		return
	}

	result, err := h.orderService.GetOrderList(&query)
	if err != nil {
		response.Fail(c, err.Error())
		return
	}

	response.Success(c, result)
}

// AdminGet 获取订单详情
// @Summary 获取订单详情（管理员）
// @Tags Admin/Order
// @Param id path int true "订单ID"
// @Success 200 {object} response.Response
// @Router /api/v1/admin/orders/{id} [get]
func (h *OrderHandler) AdminGet(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		response.Error(c, http.StatusBadRequest, "invalid order id")
		return
	}

	order, err := h.orderService.GetByID(uint(id))
	if err != nil {
		response.Error(c, http.StatusNotFound, "order not found")
		return
	}

	response.Success(c, order)
}

// MarkPaidRequest 标记已支付请求
type MarkPaidRequest struct {
	PayMethod string `json:"pay_method" binding:"required"`
}

// MarkPaid 标记已支付（手动审核）
// @Summary 标记订单已支付（管理员）
// @Tags Admin/Order
// @Accept json
// @Param id path int true "订单ID"
// @Param request body MarkPaidRequest true "支付方式"
// @Success 200 {object} response.Response
// @Router /api/v1/admin/orders/{id}/paid [post]
func (h *OrderHandler) MarkPaid(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		response.Error(c, http.StatusBadRequest, "invalid order id")
		return
	}

	var req MarkPaidRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, err.Error())
		return
	}

	if err := h.orderService.MarkPaid(uint(id), req.PayMethod); err != nil {
		response.Fail(c, err.Error())
		return
	}

	response.Success(c, nil)
}

// Refund 退款
// @Summary 退款（管理员）
// @Tags Admin/Order
// @Param id path int true "订单ID"
// @Success 200 {object} response.Response
// @Router /api/v1/admin/orders/{id}/refund [post]
func (h *OrderHandler) Refund(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		response.Error(c, http.StatusBadRequest, "invalid order id")
		return
	}

	if err := h.orderService.Refund(uint(id)); err != nil {
		response.Fail(c, err.Error())
		return
	}

	response.Success(c, nil)
}

// Delete 删除订单
// @Summary 删除订单（管理员）
// @Tags Admin/Order
// @Param id path int true "订单ID"
// @Success 200 {object} response.Response
// @Router /api/v1/admin/orders/{id} [delete]
func (h *OrderHandler) Delete(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		response.Error(c, http.StatusBadRequest, "invalid order id")
		return
	}

	if err := h.orderService.Delete(uint(id)); err != nil {
		response.Fail(c, err.Error())
		return
	}

	response.Success(c, nil)
}
